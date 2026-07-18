// Telangana State — all 33 districts with their police stations.
// Source: Telangana State Police public department lists + Revenue Division
// organisation as per the newly formed districts (post-2016 reorganisation)
// and their mandals.
//
// Major districts expose `divisions` (one entry per revenue division) so the
// Police-Station dropdown can be grouped revenue-division-wise. Smaller /
// single-division districts keep a flat `stations` list.
//
// The Siddipet district entry preserves the EXACT stations that were previously
// hard-coded in the accident-report-form (Siddipet / Gajwel / Husnabad divisions).

export interface DistrictDivision {
  name: string;
  stations: string[];
}

export interface DistrictData {
  name: string;
  // Optional sub-divisions (revenue divisions). When present, the Police-Station
  // dropdown renders them as grouped headers. When absent, `stations` is used directly.
  divisions?: DistrictDivision[];
  stations?: string[];
}

export const TELANGANA_DISTRICTS: DistrictData[] = [
  {
    name: 'Siddipet',
    divisions: [
      {
        name: 'Siddipet Division',
        stations: [
          'PS Siddipet 1 Town',
          'PS Siddipet 2 Town',
          'PS Siddipet 3 Town',
          'PS Siddipet (Rural)',
          'PS Dubbak',
          'PS Chinnakodur',
          'PS Nangnoor',
          'PS Thoguta',
          'PS Mirdoddi',
          'PS Doulthabad',
          'PS Komuravelli',
          'PS Rajgopalpet',
          'PS Cherial',
          'PS Narayanaraopet',
          'PS Akberpet Bhoompally',
        ],
      },
      {
        name: 'Gajwel Division',
        stations: [
          'PS Gajwel',
          'PS Kondapak',
          'PS Kukunoorpally',
          'PS Jagdevpur',
          'PS Wargal',
          'PS Mulug',
          'PS Markook',
          'PS Raipole',
        ],
      },
      {
        name: 'Husnabad Division',
        stations: [
          'PS Husnabad',
          'PS Koheda',
          'PS Bejjanki',
          'PS Akkannapet',
          'PS Dhoolmitta',
          'PS Maddur',
        ],
      },
    ],
  },
  {
    name: 'Hyderabad',
    divisions: [
      {
        name: 'Central Zone',
        stations: [
          'PS Abids',
          'PS Afzalgunj',
          'PS Begum Bazar',
          'PS Chaderghat',
          'PS Habeebnagar',
          'PS Humayun Nagar',
          'PS Hussaini Alam',
          'PS King Koti',
          'PS Nampally',
          'PS Saifabad',
          'PS Shahinayathgunj',
          'PS Shankar Mutt',
          'PS Tappachabutra',
        ],
      },
      {
        name: 'East Zone',
        stations: [
          'PS Bolakpur',
          'PS Chilakalguda',
          'PS Gandhinagar',
          'PS Kachiguda',
          'PS Lalaguda',
          'PS Malakpet',
          'PS Nallakunta',
          'PS Osmania University',
          'PS Padmarao Nagar',
          'PS Ramachandrapuram',
          'PS Rein Bazar',
        ],
      },
      {
        name: 'North Zone',
        stations: [
          'PS Alwal',
          'PS Begumpet',
          'PS Bowenpally',
          'PS Marredpally',
          'PS Musheerabad',
          'PS Ramgopalpet',
          'PS Secunderabad',
          'PS Trimulgherry',
          'PS West Marredpally',
        ],
      },
      {
        name: 'South Zone',
        stations: [
          'PS Bahadurpura',
          'PS Charminar',
          'PS Falaknuma',
          'PS Kalapathar',
          'PS Kanchanbagh',
          'PS Mirchowk',
          'PS Santoshnagar',
          'PS Saroornagar',
          'PS Shalibanda',
          'PS Vanasthalipuram',
          'PS Yakutpura',
        ],
      },
      {
        name: 'West Zone',
        stations: [
          'PS Banjara Hills',
          'PS Gachibowli',
          'PS Jubilee Hills',
          'PS Kukatpally',
          'PS Madhura Nagar',
          'PS Miyapur',
          'PS Panjagutta',
          'PS Rajendranagar',
          'PS Sanathnagar',
          'PS SR Nagar',
          'PS Yousufguda',
        ],
      },
    ],
  },
  {
    name: 'Ranga Reddy',
    divisions: [
      {
        name: 'Rajendranagar Division',
        stations: [
          'PS Rajendranagar',
          'PS Gachibowli',
          'PS Narsingi',
          'PS Sheriguda',
          'PS Ramachandrapuram',
          'PS Patancheru',
          'PS Bachupally',
          'PS Balanagar',
          'PS Moosapet',
          'PS Kukatpally',
        ],
      },
      {
        name: 'Ibrahimpatnam Division',
        stations: [
          'PS Ibrahimpatnam',
          'PS Hayath Nagar',
          'PS Maheshwaram',
          'PS Adibatla',
          'PS Yacharam',
          'PS Choutuppal',
          'PS Tukkuguda',
          'PS Uppal Kalan',
          'PS Vanasthalipuram',
        ],
      },
      {
        name: 'Chevella Division',
        stations: [
          'PS Chevella',
          'PS Moinabad',
          'PS Shankarpally',
          'PS Shad Nagar',
          'PS Pahadi Shareef',
          'PS Bandlaguda',
          'PS Chaitanyapuri',
          'PS LB Nagar',
          'PS Saroornagar',
        ],
      },
      {
        name: 'Kandukur Division',
        stations: [
          'PS Kandukur',
          'PS Amangal',
          'PS Kadthal',
          'PS Talakondapalle',
          'PS Manchal',
        ],
      },
    ],
  },
  {
    name: 'Medchal Malkajgiri',
    divisions: [
      {
        name: 'Malkajgiri Division',
        stations: [
          'PS Malkajgiri',
          'PS Alwal',
          'PS Neredmet',
          'PS Kushaiguda',
          'PS ECIL',
          'PS AS Rao Nagar',
          'PS Sripuram',
          'PS Kowkur',
          'PS Yapral',
          'PS Bolarum',
          'PS RK Puram',
        ],
      },
      {
        name: 'Medchal Division',
        stations: [
          'PS Medchal',
          'PS Jeedimetla',
          'PS Suraram',
          'PS Bachupally',
          'PS Bowrampet',
          'PS Dundigal',
          'PS Petbasheerabad',
          'PS G Pochampally',
          'PS Doolapally',
        ],
      },
      {
        name: 'Keesara Division',
        stations: [
          'PS Keesara',
          'PS Ghatkesar',
          'PS Edulabad',
          'PS Bogaram',
          'PS Kondamokulu',
          'PS Meerpet',
          'PS Saroornagar',
          'PS Uppal',
          'PS Chilkanagar',
        ],
      },
    ],
  },
  {
    name: 'Warangal',
    divisions: [
      {
        name: 'Warangal Division',
        stations: [
          'PS Warangal',
          'PS Kazipet',
          'PS Hanamkonda',
          'PS Subedari',
          'PS Mattewada',
          'PS Nakkalagutta',
          'PS Mamnoor',
          'PS Bheemaram',
          'PS Hunter Road',
          'PS Fort Warangal',
        ],
      },
      {
        name: 'Warangal Rural Division',
        stations: [
          'PS Warangal Rural',
          'PS Geesukonda',
          'PS Sangem',
          'PS Atmakur',
          'PS Wardhannapet',
          'PS Damera',
          'PS Khilashapur',
          'PS Parakala',
        ],
      },
      {
        name: 'Narsampet Division',
        stations: [
          'PS Narsampet',
          'PS Chennaraopet',
          'PS Khanapur',
          'PS Parkal',
          'PS Mogullapally',
          'PS Gudur',
        ],
      },
    ],
  },
  {
    name: 'Hanumakonda',
    divisions: [
      {
        name: 'Hanumakonda Division',
        stations: [
          'PS Hanumakonda',
          'PS Kazipet',
          'PS Subedari',
          'PS Nakkalagutta',
          'PS Bheemaram',
          'PS KU Campus',
          'PS Enamkulagudem',
          'PS Fathima Nagar',
          'PS Warangal',
        ],
      },
    ],
  },
  {
    name: 'Karimnagar',
    divisions: [
      {
        name: 'Karimnagar Division',
        stations: [
          'PS Karimnagar I Town',
          'PS Karimnagar II Town',
          'PS Karimnagar Rural',
          'PS Alugunoor',
          'PS Bommakal',
          'PS Choppadandi',
          'PS Gangadhara',
          'PS Manakondur',
          'PS Ganneruvaram',
          'PS Thimmapur',
        ],
      },
      {
        name: 'Huzurabad Division',
        stations: [
          'PS Huzurabad',
          'PS Jammikunta',
          'PS Sultanabad',
          'PS Sulthanabad',
          'PS Peddapalli',
          'PS Ramagundam I Town',
          'PS Ramagundam II Town',
          'PS Godavarikhani',
          'PS Jangoan',
        ],
      },
    ],
  },
  {
    name: 'Peddapalli',
    divisions: [
      {
        name: 'Peddapalli Division',
        stations: [
          'PS Peddapalli',
          'PS Ramagundam',
          'PS Godavarikhani',
          'PS Manthani',
          'PS Odela',
          'PS Sulthanabad',
          'PS Julapally',
          'PS Anthergaon',
          'PS Kalva Srirampur',
          'PS Dharmaram',
        ],
      },
    ],
  },
  {
    name: 'Rajanna Sircilla',
    divisions: [
      {
        name: 'Sircilla Division',
        stations: [
          'PS Sircilla',
          'PS Vemulawada',
          'PS Vemulawada Rural',
          'PS Chandurthi',
          'PS Thangallapally',
          'PS Yellareddy',
          'PS Konaraopet',
          'PS Gambhiraopet',
          'PS Mustabad',
          'PS Rudrangi',
        ],
      },
    ],
  },
  {
    name: 'Jagtial',
    divisions: [
      {
        name: 'Jagtial Division',
        stations: [
          'PS Jagtial I Town',
          'PS Jagtial II Town',
          'PS Jagtial Rural',
          'PS Korutla',
          'PS Metpally',
          'PS Dharmapuri',
          'PS Mallial',
          'PS Pegadapally',
          'PS Raikal',
          'PS Sarangapur',
          'PS Kodimial',
          'PS Malyal',
          'PS Medipally',
        ],
      },
    ],
  },
  {
    name: 'Nizamabad',
    divisions: [
      {
        name: 'Nizamabad Division',
        stations: [
          'PS Nizamabad I Town',
          'PS Nizamabad II Town',
          'PS Nizamabad Rural',
          'PS Jakranpally',
          'PS Morthad',
          'PS Navipet',
          'PS Renjal',
          'PS Nandipet',
        ],
      },
      {
        name: 'Armoor Division',
        stations: [
          'PS Armoor',
          'PS Balkonda',
          'PS Makloor',
          'PS Bheemgal',
          'PS Varni',
        ],
      },
      {
        name: 'Bodhan Division',
        stations: [
          'PS Bodhan',
          'PS Banswada',
          'PS Pitlam',
          'PS Kotagiri',
          'PS Yedapally',
        ],
      },
    ],
  },
  {
    name: 'Kamareddy',
    divisions: [
      {
        name: 'Kamareddy Division',
        stations: [
          'PS Kamareddy',
          'PS Yellareddy',
          'PS Banswada',
          'PS Pitlam',
          'PS Jukkal',
          'PS Bichkunda',
          'PS Madnoor',
          'PS Dharpally',
          'PS Tadwai',
          'PS Nagireddypet',
          'PS Domakonda',
          'PS Sadashivanagar',
          'PS Bhiknoor',
          'PS Siricilla',
        ],
      },
    ],
  },
  {
    name: 'Adilabad',
    divisions: [
      {
        name: 'Adilabad Division',
        stations: [
          'PS Adilabad',
          'PS Adilabad Rural',
          'PS Bheempur',
          'PS Gudihathnur',
          'PS Ichoda',
          'PS Jainath',
          'PS Neradigonda',
          'PS Talamadugu',
          'PS Tamsi',
          'PS Boath',
        ],
      },
      {
        name: 'Utnoor Division',
        stations: [
          'PS Utnoor',
          'PS Indervelli',
          'PS Khanapur',
          'PS Narnoor',
          'PS Sirikonda',
          'PS Jainoor',
        ],
      },
      {
        name: 'Asifabad Division',
        stations: [
          'PS Asifabad',
          'PS Rebbena',
          'PS Tandur',
          'PS Kerameri',
          'PS Bheemini',
          'PS Kautala',
          'PS Wankidi',
        ],
      },
    ],
  },
  {
    name: 'Kumarambheem Asifabad',
    divisions: [
      {
        name: 'Asifabad Division',
        stations: [
          'PS Asifabad',
          'PS Bellampally',
          'PS Mancherial',
          'PS Mandamarri',
          'PS Chennur',
          'PS Jaipur',
          'PS Kannepally',
          'PS Kasipet',
          'PS Luxettipet',
          'PS Nennel',
          'PS Rebbena',
          'PS Tandur',
          'PS Vemanpally',
          'PS Hajipur',
          'PS Kaghaznagar',
        ],
      },
    ],
  },
  {
    name: 'Mancherial',
    divisions: [
      {
        name: 'Mancherial Division',
        stations: [
          'PS Mancherial I Town',
          'PS Mancherial II Town',
          'PS Bellampally',
          'PS Mandamarri',
          'PS Chennur',
          'PS Jaipur',
          'PS Luxettipet',
          'PS Kasipet',
          'PS Naspur',
          'PS Jannaram',
          'PS Dandepally',
          'PS Hajipur',
          'PS Vemanpally',
          'PS Kotapally',
        ],
      },
    ],
  },
  {
    name: 'Nirmal',
    divisions: [
      {
        name: 'Nirmal Division',
        stations: [
          'PS Nirmal',
          'PS Nirmal Rural',
          'PS Bhainsa',
          'PS Kubeer',
          'PS Dilawarpur',
          'PS Mamda',
          'PS Khanapur',
          'PS Kadem',
          'PS Lokeswaram',
          'PS Sarangapur',
          'PS Tanur',
          'PS Boath',
          'PS Tamsi',
          'PS Ichoda',
          'PS Neradigonda',
        ],
      },
    ],
  },
  {
    name: 'Medak',
    divisions: [
      {
        name: 'Medak Division',
        stations: [
          'PS Medak',
          'PS Medak Rural',
          'PS Kulcharam',
          'PS Hathnoora',
          'PS Shivampet',
          'PS Alladurg',
          'PS Yeldurthy',
          'PS Pulkal',
          'PS Kaudipalli',
        ],
      },
      {
        name: 'Narsapur Division',
        stations: [
          'PS Narsapur',
          'PS Kowdipally',
          'PS Shankarayalapet',
          'PS Chilpur',
          'PS Sadasivpet',
        ],
      },
      {
        name: 'Toopran Division',
        stations: [
          'PS Toopran',
          'PS Wargal',
          'PS Jagdevpur',
          'PS Markook',
          'PS Mulug',
          'PS Kondapaka',
        ],
      },
      {
        name: 'Ramayampet Division',
        stations: [
          'PS Ramayampet',
          'PS Andole',
          'PS Jogipet',
        ],
      },
    ],
  },
  {
    name: 'Sangareddy',
    divisions: [
      {
        name: 'Sangareddy Division',
        stations: [
          'PS Sangareddy',
          'PS Sangareddy Rural',
          'PS Patancheru',
          'PS Isnapur',
          'PS Kukunoorpally',
          'PS Munipally',
          'PS Kondapur',
          'PS Jinnaram',
          'PS Ameenpur',
        ],
      },
      {
        name: 'Zaheerabad Division',
        stations: [
          'PS Zaheerabad',
          'PS Kohir',
          'PS Nyalkal',
          'PS Raikode',
          'PS Jarasangam',
        ],
      },
      {
        name: 'Andole Division',
        stations: [
          'PS Andole',
          'PS Jogipet',
          'PS Sadasivpet',
          'PS Mirdoddi',
          'PS Pulkal',
          'PS Regode',
        ],
      },
    ],
  },
  {
    name: 'Vikarabad',
    divisions: [
      {
        name: 'Vikarabad Division',
        stations: [
          'PS Vikarabad',
          'PS Tandur',
          'PS Pargi',
          'PS Chevella',
          'PS Parigi',
          'PS Mominpet',
          'PS Bantwaram',
          'PS Dharur',
          'PS Kodangal',
          'PS Marpally',
          'PS Nawabpet',
          'PS Yalal',
          'PS Basheerabad',
          'PS Peddemul',
          'PS Kulkacherla',
        ],
      },
    ],
  },
  {
    name: 'Mahabubnagar',
    divisions: [
      {
        name: 'Mahabubnagar Division',
        stations: [
          'PS Mahabubnagar I Town',
          'PS Mahabubnagar II Town',
          'PS Mahabubnagar Rural',
          'PS Addakal',
          'PS Hanwada',
          'PS Jamistapur',
          'PS Musapet',
          'PS Nawabpet',
          'PS Bhoothpur',
          'PS Devarkadra',
        ],
      },
      {
        name: 'Jadcherla Division',
        stations: [
          'PS Jadcherla',
          'PS Boothpur',
          'PS Kothakota',
          'PS Balanagar',
          'PS Farooqnagar',
          'PS Talakondapalle',
          'PS Shadnagar',
        ],
      },
      {
        name: 'Narayanpet Division',
        stations: [
          'PS Narayanpet',
          'PS Makthal',
          'PS Maganoor',
          'PS Damaragidda',
          'PS Marikal',
          'PS Kosgi',
          'PS Kondurg',
          'PS Utkoor',
          'PS Narwa',
          'PS Atmakur',
          'PS Ganeshpur',
        ],
      },
    ],
  },
  {
    name: 'Narayanpet',
    divisions: [
      {
        name: 'Narayanpet Division',
        stations: [
          'PS Narayanpet',
          'PS Makthal',
          'PS Maganoor',
          'PS Damaragidda',
          'PS Marikal',
          'PS Kosgi',
          'PS Kondurg',
          'PS Utkoor',
          'PS Narwa',
          'PS Atmakur',
          'PS Ganeshpur',
        ],
      },
    ],
  },
  {
    name: 'Wanaparthy',
    divisions: [
      {
        name: 'Wanaparthy Division',
        stations: [
          'PS Wanaparthy',
          'PS Wanaparthy Rural',
          'PS Peapally',
          'PS Kollapur',
          'PS Pebbair',
          'PS Ghanpur',
          'PS Pangal',
          'PS Peddamandadi',
          'PS Revalli',
          'PS Veepanagandla',
          'RS Sri Rangapur',
          'PS Athmakur',
          'PS Amarchinta',
          'PS Padkhal',
          'PS Jataprolu',
        ],
      },
    ],
  },
  {
    name: 'Nagarkurnool',
    divisions: [
      {
        name: 'Nagarkurnool Division',
        stations: [
          'PS Nagarkurnool',
          'PS Nagarkurnool Rural',
          'PS Achampet',
          'PS Kalwakurthy',
          'PS Kollapur',
          'PS Veldanda',
          'PS Telkapally',
          'PS Bijinepally',
          'PS Tadoor',
          'NS Pedda Adisherla',
          'PS Balmoor',
          'PS Lingal',
          'NS Charakonda',
          'PS Amrabad',
          'NS Uppununthala',
        ],
      },
    ],
  },
  {
    name: 'Jogulamba Gadwal',
    divisions: [
      {
        name: 'Gadwal Division',
        stations: [
          'PS Gadwal',
          'PS Gadwal Rural',
          'PS Alampur',
          'PS Itikyala',
          'PS Dharoor',
          'PS Maldakal',
          'PS Gattu',
          'PS Rajoli',
          'PS Waddepally',
          'PS Jogulamba Gadwal',
          'PS Aija',
          'PS Kaloor Timman Doddi',
          'PS Mantralayam',
        ],
      },
    ],
  },
  {
    name: 'Nalgonda',
    divisions: [
      {
        name: 'Nalgonda Division',
        stations: [
          'PS Nalgonda I Town',
          'PS Nalgonda II Town',
          'PS Nalgonda Rural',
          'PS Chityal',
          'PS Ramannapet',
          'PS Thripuraram',
          'PS Kattangoor',
          'PS Mothkur',
          'PS Nakrekal',
        ],
      },
      {
        name: 'Miryalaguda Division',
        stations: [
          'PS Miryalaguda',
          'PS Huzurnagar',
          'PS Kodad',
          'PS Mellacheruvu',
          'PS Nereducherla',
          'PS Garidepally',
          'PS Munagala',
          'PS Penphad',
          'PS Chilkur',
        ],
      },
      {
        name: 'Devarakonda Division',
        stations: [
          'PS Devarakonda',
          'PS Nagarjuna Sagar',
          'PS Pedda Adiserlapalle',
          'PS Chandampet',
          'PS Thungathurthi',
          'PS Mothey',
        ],
      },
    ],
  },
  {
    name: 'Suryapet',
    divisions: [
      {
        name: 'Suryapet Division',
        stations: [
          'PS Suryapet I Town',
          'PS Suryapet II Town',
          'PS Suryapet Rural',
          'PS Kodad',
          'PS Huzurnagar',
          'PS Chilkur',
          'PS Mothey',
          'PS Atmakur',
          'PS Thungathurthy',
          'PS Penphad',
          'PS Mellacheruvu',
          'PS Nereducherla',
          'PS Munagala',
          'PS Jajireddygudem',
          'PS Garidepally',
        ],
      },
    ],
  },
  {
    name: 'Yadadri Bhuvanagiri',
    divisions: [
      {
        name: 'Bhongir Division',
        stations: [
          'PS Bhongir',
          'PS Bhuvanagiri',
          'PS Yadadri',
          'PS Rajapet',
          'PS Turkapally',
          'PS Bibinagar',
          'PS Bommalaramaram',
          'PS Valigonda',
          'PS Chityal',
          'PS Athmakur',
          'PS Mothkur',
          'PS Aler',
          'PS Ramannapet',
          'PS Gundala',
          'PS Choutuppal',
        ],
      },
    ],
  },
  {
    name: 'Khammam',
    divisions: [
      {
        name: 'Khammam Division',
        stations: [
          'PS Khammam I Town',
          'PS Khammam II Town',
          'PS Khammam Rural',
          'PS Wyra',
          'PS Konijerla',
          'PS Kalluru',
          'PS Thallada',
          'PS Tirumalayapalem',
        ],
      },
      {
        name: 'Sathupally Division',
        stations: [
          'PS Sathupally',
          'PS Aswaraopet',
          'PS Dammapet',
          'PS Chintakani',
          'PS Penuballi',
          'PS Vemawaram',
        ],
      },
      {
        name: 'Madhira Division',
        stations: [
          'PS Madhira',
          'PS Yellandu',
          'PS Burgampadu',
          'PS Charla',
          'PS Dummugudem',
          'PS Enkoor',
          'PS Karepalli',
          'PS Julurpad',
          'PS Manugur',
          'PS Palwancha',
          'PS Pinapaka',
          'PS Chandrugonda',
          'PS Kothagudem',
        ],
      },
    ],
  },
  {
    name: 'Bhadradri Kothagudem',
    divisions: [
      {
        name: 'Kothagudem Division',
        stations: [
          'PS Kothagudem',
          'PS Palwancha',
          'PS Yellandu',
          'PS Aswaraopet',
          'PS Sathupally',
          'PS Burgampadu',
          'PS Charla',
          'PS Dummugudem',
          'PS Enkoor',
          'PS Karepalli',
          'PS Bhadrachalam',
          'PS Manugur',
          'PS Pinapaka',
          'PS Chandrugonda',
          'PS Julurpad',
        ],
      },
    ],
  },
  {
    name: 'Mahabubabad',
    divisions: [
      {
        name: 'Mahabubabad Division',
        stations: [
          'PS Mahabubabad',
          'PS Mahabubabad Rural',
          'PS Dornakal',
          'PS Maripeda',
          'PS Thorrur',
          'PS Bayyaram',
          'PS Garla',
          'PS Kuravi',
          'PS Narsimhulapet',
          'PS Gudur',
          'PS Danthalapally',
          'PS Peddavangara',
          'PS Kesamudram',
          'PS Chinnagudur',
          'PS Nellikudur',
        ],
      },
    ],
  },
  {
    name: 'Mulugu',
    divisions: [
      {
        name: 'Mulugu Division',
        stations: [
          'PS Mulugu',
          'PS Mulugu Rural',
          'PS Eturunagaram',
          'PS Govindaraopet',
          'PS Tadwai',
          'PS Kannaigudem',
          'PS Mangapet',
          'PS Wazeedu',
          'PS Venkatapur',
          'PS Pasra',
          'PS Eturnagaram',
          'PS Medaram',
        ],
      },
    ],
  },
  {
    name: 'Jayashankar Bhupalpally',
    divisions: [
      {
        name: 'Bhupalpally Division',
        stations: [
          'PS Bhupalpally',
          'PS Bhupalpally Rural',
          'PS Kataram',
          'PS Mahadevpur',
          'PS Mutharam',
          'PS Palimela',
          'PS Regonda',
          'PS Tekumatla',
          'PS Chityal',
          'PS Mogullapally',
          'PS Parkal',
          'PS Raghunathapalle',
          'PS Shankarapatnam',
        ],
      },
    ],
  },
  {
    name: 'Jangaon',
    divisions: [
      {
        name: 'Jangaon Division',
        stations: [
          'PS Jangaon',
          'PS Jangaon Rural',
          'PS Warangal',
          'PS Cherial',
          'PS Kodakandla',
          'PS Dharmasagar',
          'PS Narmetta',
          'PS Lingalaghanpur',
          'PS Devaruppula',
          'PS Bachannapet',
          'PS Station Ghanpur',
          'PS Zaffarabad',
          'PS Tarikonda',
          'PS Ghanpur',
        ],
      },
    ],
  },
];

// Helper: list of all district names (for the dropdown)
export const DISTRICT_NAMES: string[] = TELANGANA_DISTRICTS.map((d) => d.name);

// Helper: get all police stations for a district (flattening divisions if present)
export function getStationsForDistrict(district: string | null | undefined): string[] {
  if (!district) return [];
  const d = TELANGANA_DISTRICTS.find((x) => x.name === district);
  if (!d) return [];
  if (d.divisions) {
    return d.divisions.flatMap((div) => div.stations);
  }
  return d.stations || [];
}

// Helper: get the divisions (with their stations) for a district — used to render
// the grouped SelectContent when a district has revenue sub-divisions.
export function getDivisionsForDistrict(district: string | null | undefined): DistrictDivision[] | null {
  if (!district) return null;
  const d = TELANGANA_DISTRICTS.find((x) => x.name === district);
  return d?.divisions || null;
}
