import {
  BrazilRegion,
  BrazilUF,
  Character,
  Tournament
} from '../types/game';
import { calculateAge } from './dateUtils';
import {
  estimateTravelLogistics,
  resolveBrazilCapitalByCity,
  resolveBrazilCapitalByUf,
  resolveInternationalLocation,
  TravelLogisticsEstimate
} from './regionalGeographyHelper';

export interface TournamentHostLocation {
  hostCity: string;
  hostUf?: BrazilUF;
  hostRegion?: BrazilRegion;
  hostCountry: string;
  displayLabel: string;
  isDynamicLocal: boolean;
  isBrazil: boolean;
}

export interface TournamentGeographyEvaluation {
  territoriallyEligible: boolean;
  reasons: string[];
  host: TournamentHostLocation;
  athleteOriginLabel: string;
  athleteOriginUf?: BrazilUF;
  athleteResidesInBrazil: boolean;
  travelLogistics: TravelLogisticsEstimate;
  effectiveTravelCost: number;
  travelCoveredByPromotion: boolean;
  totalRegistrationCost: number;
  scopeLabel: string;
  scopeDescription: string;
}

export function getTournamentScopeLabel(scope: Tournament['scope']): string {
  switch (scope) {
    case 'municipal':
      return 'Municipal';
    case 'estadual':
      return 'Estadual';
    case 'regional':
      return 'Regional';
    case 'nacional':
      return 'Nacional';
    case 'internacional':
      return 'Internacional';
    case 'mundial':
      return 'Mundial';
    case 'mma_pro':
      return 'MMA Profissional';
  }
}

function getAthleteOrigin(
  character: Pick<Character, 'currentCity' | 'currentCountry' | 'homeCity' | 'homeState'>
): {
  residesInBrazil: boolean;
  uf?: BrazilUF;
  city: string;
  country: string;
  label: string;
} {
  const country = character.currentCountry || 'Brasil';
  const residesInBrazil = country === 'Brasil';

  if (residesInBrazil) {
    const cap = resolveBrazilCapitalByCity(
      character.currentCity || character.homeCity,
      character.homeState || 'SP'
    );
    return {
      residesInBrazil: true,
      uf: cap.uf,
      city: cap.capital,
      country: 'Brasil',
      label: `${cap.capital} (${cap.uf})`
    };
  }

  const city = character.currentCity || character.homeCity || 'Exterior';
  return {
    residesInBrazil: false,
    city,
    country,
    label: `${city} (${country})`
  };
}

/**
 * Resolve a sede oficial de um campeonato respeitando estritamente as 27 capitais brasileiras
 * para torneios nacionais/locais e polos internacionais reais para eventos globais.
 */
export function resolveTournamentHostLocation(
  tournament: Tournament,
  character: Pick<Character, 'currentCity' | 'currentCountry' | 'homeCity' | 'homeState'>
): TournamentHostLocation {
  const origin = getAthleteOrigin(character);

  const usesDynamicLocalHost =
    Boolean(tournament.dynamicLocalHost) ||
    ((tournament.scope === 'municipal' || tournament.scope === 'estadual') &&
      !tournament.hostCity &&
      !tournament.hostUf);

  if (usesDynamicLocalHost) {
    const localCap = origin.residesInBrazil
      ? resolveBrazilCapitalByUf(origin.uf || character.homeState || 'SP')
      : resolveBrazilCapitalByUf(character.homeState || 'SP');

    return {
      hostCity: localCap.capital,
      hostUf: localCap.uf,
      hostRegion: localCap.region,
      hostCountry: 'Brasil',
      displayLabel: `${localCap.capital} (${localCap.uf})`,
      isDynamicLocal: true,
      isBrazil: true
    };
  }

  const isBrazil = !tournament.hostCountry || tournament.hostCountry === 'Brasil';
  if (isBrazil) {
    const cap = tournament.hostCity
      ? resolveBrazilCapitalByCity(tournament.hostCity, tournament.hostUf || 'SP')
      : resolveBrazilCapitalByUf(tournament.hostUf || 'SP');

    return {
      hostCity: cap.capital,
      hostUf: cap.uf,
      hostRegion: cap.region,
      hostCountry: 'Brasil',
      displayLabel: `${cap.capital} (${cap.uf})`,
      isDynamicLocal: false,
      isBrazil: true
    };
  }

  const intl = resolveInternationalLocation(tournament.hostCity);
  const hostCity = intl?.label || tournament.hostCity || 'Sede Internacional';
  const hostCountry = intl?.country || tournament.hostCountry || 'Exterior';

  return {
    hostCity,
    hostCountry,
    displayLabel: `${hostCity} (${hostCountry})`,
    isDynamicLocal: false,
    isBrazil: false
  };
}

/**
 * Avalia elegibilidade territorial, abrangência geográfica e logística/despesa real
 * de deslocamento entre a localidade atual do atleta e a sede oficial do torneio.
 */
export function evaluateTournamentGeographyAndTravel(
  character: Pick<
    Character,
    | 'age'
    | 'birthDate'
    | 'currentDate'
    | 'currentCity'
    | 'currentCountry'
    | 'homeCity'
    | 'homeState'
    | 'familySupport'
  >,
  tournament: Tournament
): TournamentGeographyEvaluation {
  const origin = getAthleteOrigin(character);
  const host = resolveTournamentHostLocation(tournament, character);
  const reasons: string[] = [];

  const realAge =
    character.birthDate && character.currentDate
      ? calculateAge(character.birthDate, character.currentDate)
      : Math.max(0, Number(character.age) || 0);

  const travelLogistics = estimateTravelLogistics(
    {
      country: origin.country,
      uf: origin.uf,
      city: origin.city
    },
    {
      country: host.hostCountry,
      uf: host.hostUf,
      city: host.hostCity
    }
  );

  // 1. Regras territoriais por abrangência (scope)
  if (tournament.scope === 'municipal') {
    if (!origin.residesInBrazil) {
      reasons.push(
        `Abrangência municipal: disponível apenas enquanto o atleta reside no Brasil (base atual: ${origin.label}).`
      );
    } else if (host.hostUf && origin.uf && host.hostUf !== origin.uf) {
      reasons.push(
        `Abrangência municipal restrita à capital sede (${host.displayLabel}). Sua base atual é ${origin.label}.`
      );
    }
  } else if (tournament.scope === 'estadual') {
    if (!origin.residesInBrazil) {
      reasons.push(
        `Abrangência estadual: exige residência e filiação ativa em federação estadual do Brasil (base atual: ${origin.label}).`
      );
    } else if (host.hostUf && origin.uf && host.hostUf !== origin.uf) {
      reasons.push(
        `Campeonato estadual vinculado a ${host.hostUf} (${host.displayLabel}). Seu atleta compete atualmente por ${origin.uf}.`
      );
    }
  } else if (tournament.scope === 'regional') {
    if (!origin.residesInBrazil) {
      reasons.push(
        `Circuito regional brasileiro (${host.displayLabel}): requer residência em uma das 27 localidades do Brasil.`
      );
    }
  }
  // 'nacional', 'internacional', 'mundial' e 'mma_pro' permitem participação de qualquer estado/localidade mediante deslocamento.

  // 2. Autorização familiar para viagens longas de menores de idade
  const familySupport = character.familySupport ?? 80;
  if (!travelLogistics.isSameCapital) {
    if (travelLogistics.isInternational && realAge < 18 && familySupport < 40) {
      reasons.push(
        `Viagem internacional de menor (${realAge} anos) bloqueada por falta de autorização/apoio familiar (${familySupport}/100, mínimo 40).`
      );
    } else if (!travelLogistics.isInternational && realAge < 16 && familySupport < 40) {
      reasons.push(
        `Deslocamento interestadual de menor (${realAge} anos) exige apoio familiar mínimo de 40/100 (atual: ${familySupport}).`
      );
    }
  }

  // Convites profissionais principais sem taxa de inscrição (Jungle Fight Título / World Octagon PPV) cobrem passagem
  const travelCoveredByPromotion =
    tournament.scope === 'mma_pro' && tournament.entryFee === 0;
  const effectiveTravelCost = travelCoveredByPromotion
    ? 0
    : travelLogistics.estimatedCost;
  const totalRegistrationCost = tournament.entryFee + effectiveTravelCost;

  let scopeDescription = '';
  if (tournament.scope === 'municipal') {
    scopeDescription = `Disputa local na sua capital (${host.displayLabel}), aberta aos atletas residentes.`;
  } else if (tournament.scope === 'estadual') {
    scopeDescription = `Vinculado à federação estadual de ${host.hostUf} em ${host.displayLabel}.`;
  } else if (tournament.scope === 'regional') {
    scopeDescription = `Sediado em ${host.displayLabel}; aberto às capitais brasileiras mediante deslocamento.`;
  } else if (tournament.scope === 'nacional') {
    scopeDescription = `Aberto a atletas dos 26 estados e DF; sede oficial em ${host.displayLabel}.`;
  } else if (tournament.scope === 'internacional' || tournament.scope === 'mundial') {
    scopeDescription = `Evento de abrangência global sediado em ${host.displayLabel}.`;
  } else {
    scopeDescription = `Card profissional sediado em ${host.displayLabel}${travelCoveredByPromotion ? ' (passagem custeada pela organização)' : ''}.`;
  }

  return {
    territoriallyEligible: reasons.length === 0,
    reasons,
    host,
    athleteOriginLabel: origin.label,
    athleteOriginUf: origin.uf,
    athleteResidesInBrazil: origin.residesInBrazil,
    travelLogistics,
    effectiveTravelCost,
    travelCoveredByPromotion,
    totalRegistrationCost,
    scopeLabel: getTournamentScopeLabel(tournament.scope),
    scopeDescription
  };
}
