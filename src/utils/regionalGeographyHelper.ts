import {
  BRAZIL_CAPITALS_COUNT,
  BRAZIL_STATES,
  BrazilStateInfo,
  getStateByUf
} from '../data/brazilLocations';
import {
  BrazilUF,
  GeoCoordinates,
  RegionalInfrastructureLevel
} from '../types/game';

export type TravelScopeCategory =
  | 'local'
  | 'regional_curta'
  | 'nacional_media'
  | 'nacional_longa'
  | 'internacional';

export type TravelTransportMode =
  | 'urbano'
  | 'rodoviario'
  | 'aereo_nacional'
  | 'aereo_internacional';

export interface TravelLogisticsEstimate {
  originLabel: string;
  destinationLabel: string;
  isSameCapital: boolean;
  isInternational: boolean;
  distanceKm: number;
  scopeCategory: TravelScopeCategory;
  transportMode: TravelTransportMode;
  estimatedCost: number;
  travelDays: number;
  fatigueImpact: number;
  summaryLabel: string;
}

export interface CapitalProfileSummary {
  state: BrazilStateInfo;
  costTierLabel: 'Baixo' | 'Moderado' | 'Alto' | 'Muito Alto';
  infrastructureLabel: string;
  sponsorshipLabel: 'Restrito' | 'Emergente' | 'Forte' | 'Metrópole Global';
  monthlyBaseLivingTotal: number;
}

function normalizeLocationText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapa de aliases legados e municípios brasileiros históricos de saves/NPCs antigos
 * para normalização segura rumo às 27 capitais oficiais.
 */
const LEGACY_BRAZIL_CITY_TO_UF: Record<string, BrazilUF> = {
  'salvador da bahia': 'BA',
  'rio de janeiro - rj': 'RJ',
  'sao paulo - sp': 'SP',
  'brasilia - df': 'DF',
  'campinas': 'SP',
  'santos': 'SP',
  'rio claro': 'SP',
  'santo andre': 'SP',
  'guaruja': 'SP',
  'niteroi': 'RJ',
  'londrina': 'PR',
  'maringa': 'PR',
  'joinville': 'SC',
  'feira de santana': 'BA',
  'soure': 'PA',
  'governador valadares': 'MG'
};

/**
 * Coordenadas geográficas de polos internacionais já existentes no jogo
 * (academias estrangeiras e sedes de campeonatos mundiais/internacionais).
 */
const INTERNATIONAL_CITY_COORDS: Record<string, { label: string; country: string; coords: GeoCoordinates }> = {
  'phuket': { label: 'Phuket', country: 'Tailândia', coords: { lat: 7.8804, lng: 98.3923 } },
  'bangkok': { label: 'Bangkok', country: 'Tailândia', coords: { lat: 13.7563, lng: 100.5018 } },
  'pattaya': { label: 'Pattaya', country: 'Tailândia', coords: { lat: 12.9236, lng: 100.8825 } },
  'nonthaburi': { label: 'Nonthaburi', country: 'Tailândia', coords: { lat: 13.8621, lng: 100.5144 } },
  'los angeles': { label: 'Los Angeles', country: 'Estados Unidos', coords: { lat: 34.0522, lng: -118.2437 } },
  'los angeles / hollywood': { label: 'Los Angeles', country: 'Estados Unidos', coords: { lat: 34.0928, lng: -118.3287 } },
  'hollywood': { label: 'Hollywood', country: 'Estados Unidos', coords: { lat: 34.0928, lng: -118.3287 } },
  'long beach': { label: 'Long Beach', country: 'Estados Unidos', coords: { lat: 33.7701, lng: -118.1937 } },
  'costa mesa': { label: 'Costa Mesa', country: 'Estados Unidos', coords: { lat: 33.6411, lng: -117.9187 } },
  'las vegas': { label: 'Las Vegas', country: 'Estados Unidos', coords: { lat: 36.1699, lng: -115.1398 } },
  'nova york': { label: 'Nova York', country: 'Estados Unidos', coords: { lat: 40.7128, lng: -74.006 } },
  'new york': { label: 'Nova York', country: 'Estados Unidos', coords: { lat: 40.7128, lng: -74.006 } },
  'coconut creek': { label: 'Coconut Creek', country: 'Estados Unidos', coords: { lat: 26.2517, lng: -80.1789 } },
  'coconut creek, florida': { label: 'Coconut Creek', country: 'Estados Unidos', coords: { lat: 26.2517, lng: -80.1789 } },
  'miami': { label: 'Miami', country: 'Estados Unidos', coords: { lat: 25.7617, lng: -80.1918 } },
  'austin': { label: 'Austin', country: 'Estados Unidos', coords: { lat: 30.2672, lng: -97.7431 } },
  'danbury': { label: 'Danbury', country: 'Estados Unidos', coords: { lat: 41.3948, lng: -73.454 } },
  'makhachkala': { label: 'Makhachkala', country: 'Rússia', coords: { lat: 42.9849, lng: 47.5047 } },
  'makhachkala / caucaso': { label: 'Makhachkala', country: 'Rússia', coords: { lat: 42.9849, lng: 47.5047 } },
  'moscou': { label: 'Moscou', country: 'Rússia', coords: { lat: 55.7558, lng: 37.6173 } },
  'sao petersburgo': { label: 'São Petersburgo', country: 'Rússia', coords: { lat: 59.9343, lng: 30.3351 } },
  'toquio': { label: 'Tóquio', country: 'Japão', coords: { lat: 35.6762, lng: 139.6503 } },
  'yokohama': { label: 'Yokohama', country: 'Japão', coords: { lat: 35.4437, lng: 139.638 } },
  'kyoto': { label: 'Kyoto', country: 'Japão', coords: { lat: 35.0116, lng: 135.7681 } },
  'tenri': { label: 'Tenri', country: 'Japão', coords: { lat: 34.5968, lng: 135.8371 } },
  'paris': { label: 'Paris', country: 'França', coords: { lat: 48.8566, lng: 2.3522 } },
  'londres': { label: 'Londres', country: 'Reino Unido', coords: { lat: 51.5072, lng: -0.1276 } },
  'leeds': { label: 'Leeds', country: 'Reino Unido', coords: { lat: 53.8008, lng: -1.5491 } },
  'manchester': { label: 'Manchester', country: 'Reino Unido', coords: { lat: 53.4808, lng: -2.2426 } },
  'roma': { label: 'Roma', country: 'Itália', coords: { lat: 41.9028, lng: 12.4964 } },
  'milao': { label: 'Milão', country: 'Itália', coords: { lat: 45.4642, lng: 9.19 } },
  'madri': { label: 'Madri', country: 'Espanha', coords: { lat: 40.4168, lng: -3.7038 } },
  'cidade do mexico': { label: 'Cidade do México', country: 'México', coords: { lat: 19.4326, lng: -99.1332 } },
  'lviv': { label: 'Lviv', country: 'Ucrânia', coords: { lat: 49.8397, lng: 24.0297 } },
  'tbilisi': { label: 'Tbilisi', country: 'Geórgia', coords: { lat: 41.7151, lng: 44.8271 } },
  'pequim': { label: 'Pequim', country: 'China', coords: { lat: 39.9042, lng: 116.4074 } }
};

export function getAllPlayableCapitals(): BrazilStateInfo[] {
  return BRAZIL_STATES;
}

export function resolveBrazilCapitalByUf(uf?: string): BrazilStateInfo {
  return getStateByUf(uf || 'SP');
}

/**
 * Verifica estritamente se o nome informado é exatamente uma das 27 capitais jogáveis.
 */
export function isStrictPlayableCapital(cityName?: string): boolean {
  const norm = normalizeLocationText(cityName || '');
  if (!norm) return false;
  return BRAZIL_STATES.some((s) => normalizeLocationText(s.capital) === norm);
}

/**
 * Resolve uma string de cidade brasileira (inclusive aliases legados como "Salvador da Bahia"
 * ou cidades antigas do interior) para a respectiva capital oficial dentro das 27 localidades.
 */
export function resolveBrazilCapitalByCity(
  cityName?: string,
  fallbackUf: string = 'SP'
): BrazilStateInfo {
  const norm = normalizeLocationText(cityName || '');
  if (!norm || norm === 'comunidade local') {
    return getStateByUf(fallbackUf);
  }

  const exactCapital = BRAZIL_STATES.find((s) => normalizeLocationText(s.capital) === norm);
  if (exactCapital) return exactCapital;

  // Caso venha com sufixo ou prefixo do tipo "Curitiba (PR)" ou "Manaus, AM"
  const byContainment = BRAZIL_STATES.find((s) => {
    const capNorm = normalizeLocationText(s.capital);
    return norm === `${capNorm} (${s.uf.toLowerCase()})` || norm.startsWith(`${capNorm} -`) || norm.startsWith(`${capNorm},`);
  });
  if (byContainment) return byContainment;

  const mappedUf = LEGACY_BRAZIL_CITY_TO_UF[norm];
  if (mappedUf) return getStateByUf(mappedUf);

  return getStateByUf(fallbackUf);
}

export function resolveInternationalLocation(
  cityName?: string
): { label: string; country: string; coords: GeoCoordinates } | undefined {
  const norm = normalizeLocationText(cityName || '');
  if (!norm) return undefined;
  if (INTERNATIONAL_CITY_COORDS[norm]) {
    return INTERNATIONAL_CITY_COORDS[norm];
  }
  const matchedKey = Object.keys(INTERNATIONAL_CITY_COORDS).find(
    (k) => norm.includes(k) || k.includes(norm)
  );
  return matchedKey ? INTERNATIONAL_CITY_COORDS[matchedKey] : undefined;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calcula distância geodésica em km pela fórmula de Haversine.
 */
export function calculateGeoDistanceKm(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 6371; // Raio médio da Terra em km
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

export interface TravelPointInput {
  country?: string;
  uf?: string;
  city?: string;
}

function resolvePointCoordinates(point: TravelPointInput): {
  label: string;
  isBrazil: boolean;
  uf?: BrazilUF;
  coords: GeoCoordinates;
} {
  const countryNorm = normalizeLocationText(point.country || 'Brasil');
  const isBrazil = !point.country || countryNorm === 'brasil' || countryNorm === 'brazil';

  if (isBrazil) {
    const cap = point.city
      ? resolveBrazilCapitalByCity(point.city, point.uf || 'SP')
      : resolveBrazilCapitalByUf(point.uf || 'SP');
    return {
      label: `${cap.capital} (${cap.uf})`,
      isBrazil: true,
      uf: cap.uf,
      coords: cap.coordinates
    };
  }

  const intl = resolveInternationalLocation(point.city);
  if (intl) {
    return {
      label: `${intl.label} (${intl.country})`,
      isBrazil: false,
      coords: intl.coords
    };
  }

  // Fallback internacional coerente caso cidade externa não esteja no mapa detalhado
  return {
    label: `${point.city || 'Exterior'} (${point.country})`,
    isBrazil: false,
    coords: { lat: 38.0, lng: -77.0 }
  };
}

/**
 * Estima logística completa de deslocamento (distância, modo, custo base, dias e desgaste)
 * entre duas localidades (capitais brasileiras ou polos internacionais), de forma 100% determinística.
 */
export function estimateTravelLogistics(
  origin: TravelPointInput,
  destination: TravelPointInput
): TravelLogisticsEstimate {
  const orig = resolvePointCoordinates(origin);
  const dest = resolvePointCoordinates(destination);

  const isSameCapital =
    orig.isBrazil && dest.isBrazil && orig.uf !== undefined && orig.uf === dest.uf;
  const isSameForeignCity =
    !orig.isBrazil &&
    !dest.isBrazil &&
    normalizeLocationText(orig.label) === normalizeLocationText(dest.label);

  if (isSameCapital || isSameForeignCity) {
    return {
      originLabel: orig.label,
      destinationLabel: dest.label,
      isSameCapital: true,
      isInternational: !dest.isBrazil,
      distanceKm: 0,
      scopeCategory: 'local',
      transportMode: 'urbano',
      estimatedCost: 0,
      travelDays: 0,
      fatigueImpact: 0,
      summaryLabel: 'Deslocamento local na mesma cidade (R$ 0)'
    };
  }

  const distanceKm = Math.max(25, calculateGeoDistanceKm(orig.coords, dest.coords));
  const isInternational = !orig.isBrazil || !dest.isBrazil;

  if (isInternational) {
    const estimatedCost = Math.min(4200, Math.max(1150, Math.round(950 + distanceKm * 0.14)));
    const travelDays = distanceKm > 9000 ? 3 : 2;
    const fatigueImpact = distanceKm > 9000 ? 18 : 12;
    return {
      originLabel: orig.label,
      destinationLabel: dest.label,
      isSameCapital: false,
      isInternational: true,
      distanceKm,
      scopeCategory: 'internacional',
      transportMode: 'aereo_internacional',
      estimatedCost,
      travelDays,
      fatigueImpact,
      summaryLabel: `Voo internacional (${distanceKm.toLocaleString('pt-BR')} km • ~${travelDays} dia(s) • R$ ${estimatedCost.toLocaleString('pt-BR')})`
    };
  }

  if (distanceKm <= 600) {
    const estimatedCost = Math.max(95, Math.round(70 + distanceKm * 0.38));
    return {
      originLabel: orig.label,
      destinationLabel: dest.label,
      isSameCapital: false,
      isInternational: false,
      distanceKm,
      scopeCategory: 'regional_curta',
      transportMode: 'rodoviario',
      estimatedCost,
      travelDays: 1,
      fatigueImpact: 4,
      summaryLabel: `Deslocamento regional (${distanceKm.toLocaleString('pt-BR')} km • 1 dia • R$ ${estimatedCost.toLocaleString('pt-BR')})`
    };
  }

  if (distanceKm <= 1650) {
    const estimatedCost = Math.round(210 + distanceKm * 0.24);
    return {
      originLabel: orig.label,
      destinationLabel: dest.label,
      isSameCapital: false,
      isInternational: false,
      distanceKm,
      scopeCategory: 'nacional_media',
      transportMode: 'aereo_nacional',
      estimatedCost,
      travelDays: 1,
      fatigueImpact: 7,
      summaryLabel: `Voo nacional (${distanceKm.toLocaleString('pt-BR')} km • 1 dia • R$ ${estimatedCost.toLocaleString('pt-BR')})`
    };
  }

  const estimatedCost = Math.min(1450, Math.round(280 + distanceKm * 0.26));
  return {
    originLabel: orig.label,
    destinationLabel: dest.label,
    isSameCapital: false,
    isInternational: false,
    distanceKm,
    scopeCategory: 'nacional_longa',
    transportMode: 'aereo_nacional',
    estimatedCost,
    travelDays: 2,
    fatigueImpact: 11,
    summaryLabel: `Voo nacional de longa distância (${distanceKm.toLocaleString('pt-BR')} km • 2 dias • R$ ${estimatedCost.toLocaleString('pt-BR')})`
  };
}

export function getInfrastructureLabel(level: RegionalInfrastructureLevel): string {
  switch (level) {
    case 'metropole_olimpica':
      return 'Metrópole Olímpica & Polo Nacional';
    case 'avancada':
      return 'Infraestrutura Avançada';
    case 'intermediaria':
      return 'Infraestrutura Intermediária';
    case 'basica':
    default:
      return 'Base em Desenvolvimento';
  }
}

export function getCapitalProfileSummary(uf: string): CapitalProfileSummary {
  const state = resolveBrazilCapitalByUf(uf);
  const idx = state.economy.costOfLivingIndex;
  const costTierLabel: CapitalProfileSummary['costTierLabel'] =
    idx >= 1.22 ? 'Muito Alto' : idx >= 1.04 ? 'Alto' : idx >= 0.90 ? 'Moderado' : 'Baixo';

  const sp = state.sport.sponsorshipMarketIndex;
  const sponsorshipLabel: CapitalProfileSummary['sponsorshipLabel'] =
    sp >= 1.25
      ? 'Metrópole Global'
      : sp >= 1.05
      ? 'Forte'
      : sp >= 0.88
      ? 'Emergente'
      : 'Restrito';

  const monthlyBaseLivingTotal =
    state.economy.housingBase +
    state.economy.foodBase +
    state.economy.transportBase +
    state.economy.healthBase;

  return {
    state,
    costTierLabel,
    infrastructureLabel: getInfrastructureLabel(state.sport.infrastructureLevel),
    sponsorshipLabel,
    monthlyBaseLivingTotal
  };
}

export { BRAZIL_CAPITALS_COUNT };
