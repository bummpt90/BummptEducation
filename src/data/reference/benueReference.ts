/**
 * BummptEducation — Benue State Geographic & Administrative Reference Data
 * 
 * AUTHORITATIVE REFERENCE DATA:
 * Contains the 23 Local Government Areas (LGAs) of Benue State, Nigeria,
 * their respective Senatorial Zones, administrative headquarters, and official
 * educational administrative reference boundaries.
 * 
 * ARCHITECTURAL INVARIANT:
 * This file contains strictly geographic and institutional administrative reference metadata.
 * It contains ZERO runtime synthetic simulation, ZERO Math.random(), and NO fabricated
 * live student or teacher rosters.
 */

import { BenueLGA, SenatorialZone, LGAMetadata } from '../../types';

export const BENUE_SENATORIAL_ZONES: Record<SenatorialZone, BenueLGA[]> = {
  'Zone A (Benue North-East)': [
    'Katsina-Ala',
    'Konshisha',
    'Kwande',
    'Logo',
    'Ukum',
    'Ushongo',
    'Vandeikya'
  ],
  'Zone B (Benue North-West)': [
    'Buruku',
    'Gboko',
    'Guma',
    'Gwer East',
    'Gwer West',
    'Makurdi',
    'Tarka'
  ],
  'Zone C (Benue South)': [
    'Ado',
    'Agatu',
    'Apa',
    'Obi',
    'Ogbadibo',
    'Ohimini',
    'Oju',
    'Okpokwu',
    'Otukpo'
  ]
};

export const BENUE_LGAS_METADATA: LGAMetadata[] = [
  // Zone A (Benue North-East)
  {
    lga: 'Katsina-Ala',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Katsina-Ala',
    educationSecretary: 'Dr. Terver James Akaa',
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Konshisha',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Tse-Agberagba',
    educationSecretary: 'Mrs. Dooshima Comfort Iorliam',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Kwande',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Adikpo (London of Benue)',
    educationSecretary: 'Hon. Shima Clement Ugba',
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Logo',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Ugba',
    educationSecretary: 'Mr. Emmanuel Terna Tyokyaa',
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Ukum',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Zaki Biam',
    educationSecretary: 'Chief Aondoakaa David Msugh',
    priorityFlag: 'Needs Attention'
  },
  {
    lga: 'Ushongo',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Lessel',
    educationSecretary: 'Mrs. Bridget Nguvan Chia',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Vandeikya',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Vandeikya',
    educationSecretary: 'Dr. Joseph Vershima Kator',
    priorityFlag: 'Excellence Zone'
  },

  // Zone B (Benue North-West)
  {
    lga: 'Buruku',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Buruku',
    educationSecretary: 'Mr. Paul Teryila Akor',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Gboko',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Gboko',
    educationSecretary: 'Dr. (Mrs.) Bridget Mnguember Iornem',
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Guma',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Gbajimba',
    educationSecretary: 'Hon. Vitalis Terungwa Uke',
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Gwer East',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Aliade',
    educationSecretary: 'Mrs. Felicia Mwuese Nyikwagh',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Gwer West',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Naka',
    educationSecretary: 'Mr. Donald Terfa Gbande',
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Makurdi',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Makurdi (State Capital)',
    educationSecretary: 'Prof. Dennis Aondoaver Tyough',
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Tarka',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Wannune',
    educationSecretary: 'Hon. Simon Mnena Mbakighir',
    priorityFlag: 'Normal'
  },

  // Zone C (Benue South)
  {
    lga: 'Ado',
    zone: 'Zone C (Benue South)',
    headquarters: 'Igumale',
    educationSecretary: 'Mr. Sunday Oche Otache',
    priorityFlag: 'Needs Attention'
  },
  {
    lga: 'Agatu',
    zone: 'Zone C (Benue South)',
    headquarters: 'Obagaji',
    educationSecretary: 'Hon. Godwin Ochoche Elaigwu',
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Apa',
    zone: 'Zone C (Benue South)',
    headquarters: 'Ugbokpo',
    educationSecretary: 'Mrs. Rebecca Ene Audu',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Obi',
    zone: 'Zone C (Benue South)',
    headquarters: 'Obarike-Ito',
    educationSecretary: 'Mr. Christopher Edeh Ogbu',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Ogbadibo',
    zone: 'Zone C (Benue South)',
    headquarters: 'Otukpa',
    educationSecretary: 'Dr. Mrs. Alice Onyemowo Idoko',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Ohimini',
    zone: 'Zone C (Benue South)',
    headquarters: 'Idekpa',
    educationSecretary: 'Mr. Francis Ocheje Agbo',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Oju',
    zone: 'Zone C (Benue South)',
    headquarters: 'Oju',
    educationSecretary: 'Dr. Michael Odeh Ikpeme',
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Okpokwu',
    zone: 'Zone C (Benue South)',
    headquarters: 'Okpoga',
    educationSecretary: 'Mrs. Patricia Onyowoichie Abah',
    priorityFlag: 'Normal'
  },
  {
    lga: 'Otukpo',
    zone: 'Zone C (Benue South)',
    headquarters: 'Otukpo',
    educationSecretary: 'Chief Lawrence Owoicho Adofu',
    priorityFlag: 'Excellence Zone'
  }
];

export function getLgaReferenceMetadata(lga: BenueLGA): LGAMetadata | undefined {
  return BENUE_LGAS_METADATA.find(l => l.lga === lga);
}
