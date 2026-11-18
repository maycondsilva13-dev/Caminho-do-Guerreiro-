import { AgeCategory, MartialArtType, OfficialGiColor } from '../types/game';

export type BjjAgeDivisionId =
  | 'pre_mirim'
  | 'mirim'
  | 'infantil_a'
  | 'infantil_b'
  | 'infanto_juvenil_a'
  | 'infanto_juvenil_b'
  | 'juvenil_1'
  | 'juvenil_2'
  | 'adulto'
  | 'master_1'
  | 'master_2'
  | 'master_3'
  | 'master_4'
  | 'master_5'
  | 'master_6';

export interface SportAgeDivision {
  id: string;
  label: string;
  shortLabel: string;
  broadCategory: AgeCategory;
  minAge: number;
  maxAge: number | null;
  matchDurationSeconds?: number;
}

export interface DivisionWeightOption {
  id: string;
  name: string;
  label: string;
  minWeight: number;
  maxWeight: number | null; // null = Sem limite
  displayLimit: string;
}

export const CBJJ_OFFICIAL_GI_WEIGHT_KG = 1.8;

export const CBJJ_OFFICIAL_GI_COLORS: Array<{
  id: OfficialGiColor;
  label: string;
  swatchClass: string;
  note: string;
}> = [
  {
    id: 'branco',
    label: 'Branco Oficial',
    swatchClass: 'bg-slate-100 text-slate-950 border-slate-300',
    note: 'Padrão clássico CBJJ/IBJJF em algodão trançado'
  },
  {
    id: 'azul',
    label: 'Azul Royal Oficial',
    swatchClass: 'bg-blue-600 text-white border-blue-400',
    note: 'Padrão competitivo CBJJ/IBJJF (azul royal homologado)'
  },
  {
    id: 'preto',
    label: 'Preto Oficial',
    swatchClass: 'bg-neutral-900 text-neutral-100 border-neutral-600',
    note: 'Padrão competitivo CBJJ/IBJJF com lapela regulamentar'
  }
];

function buildWeightSeries(
  prefix: string,
  entries: Array<{ idSuffix: string; name: string; maxWeight: number | null }>
): DivisionWeightOption[] {
  let prevMax = 0;
  return entries.map((e, idx) => {
    const minWeight = idx === 0 ? 0 : Math.round((prevMax + 0.01) * 100) / 100;
    const label =
      e.maxWeight === null
        ? `${e.name} (Sem limite · acima de ${prevMax.toFixed(2).replace('.', ',')} kg)`
        : `${e.name} (até ${e.maxWeight.toFixed(2).replace('.', ',')} kg)`;
    const displayLimit =
      e.maxWeight === null
        ? `Acima de ${prevMax.toFixed(2).replace('.', ',')} kg (Sem limite)`
        : `Até ${e.maxWeight.toFixed(2).replace('.', ',')} kg`;
    if (e.maxWeight !== null) {
      prevMax = e.maxWeight;
    }
    return {
      id: `${prefix}_${e.idSuffix}`,
      name: e.name,
      label,
      minWeight,
      maxWeight: e.maxWeight,
      displayLimit
    };
  });
}

// ---------------------------------------------------------------------------
// 1. JIU-JITSU BRASILEIRO (CBJJ / IBJJF) — IDADES & TABELAS DE PESO
// ---------------------------------------------------------------------------

export const BJJ_AGE_DIVISIONS: SportAgeDivision[] = [
  { id: 'pre_mirim', label: 'Pré-Mirim (4 e 5 anos)', shortLabel: 'Pré-Mirim', broadCategory: 'infantil', minAge: 4, maxAge: 5, matchDurationSeconds: 120 },
  { id: 'mirim', label: 'Mirim (6 e 7 anos)', shortLabel: 'Mirim', broadCategory: 'infantil', minAge: 6, maxAge: 7, matchDurationSeconds: 180 },
  { id: 'infantil_a', label: 'Infantil A (8 e 9 anos)', shortLabel: 'Infantil A', broadCategory: 'infantil', minAge: 8, maxAge: 9, matchDurationSeconds: 180 },
  { id: 'infantil_b', label: 'Infantil B (10 e 11 anos)', shortLabel: 'Infantil B', broadCategory: 'infantil', minAge: 10, maxAge: 11, matchDurationSeconds: 180 },
  { id: 'infanto_juvenil_a', label: 'Infanto-Juvenil A (12 e 13 anos)', shortLabel: 'Infanto A', broadCategory: 'infantil', minAge: 12, maxAge: 13, matchDurationSeconds: 240 },
  { id: 'infanto_juvenil_b', label: 'Infanto-Juvenil B (14 e 15 anos)', shortLabel: 'Infanto B', broadCategory: 'juvenil', minAge: 14, maxAge: 15, matchDurationSeconds: 240 },
  { id: 'juvenil_1', label: 'Juvenil 1 (16 anos)', shortLabel: 'Juvenil 1', broadCategory: 'juvenil', minAge: 16, maxAge: 16, matchDurationSeconds: 300 },
  { id: 'juvenil_2', label: 'Juvenil 2 (17 anos)', shortLabel: 'Juvenil 2', broadCategory: 'juvenil', minAge: 17, maxAge: 17, matchDurationSeconds: 300 },
  { id: 'adulto', label: 'Adulto (18 a 29 anos)', shortLabel: 'Adulto', broadCategory: 'adulto', minAge: 18, maxAge: 29, matchDurationSeconds: 360 },
  { id: 'master_1', label: 'Master 1 (30 a 35 anos)', shortLabel: 'Master 1', broadCategory: 'master', minAge: 30, maxAge: 35, matchDurationSeconds: 300 },
  { id: 'master_2', label: 'Master 2 (36 a 40 anos)', shortLabel: 'Master 2', broadCategory: 'master', minAge: 36, maxAge: 40, matchDurationSeconds: 300 },
  { id: 'master_3', label: 'Master 3 (41 a 45 anos)', shortLabel: 'Master 3', broadCategory: 'master', minAge: 41, maxAge: 45, matchDurationSeconds: 300 },
  { id: 'master_4', label: 'Master 4 (46 a 50 anos)', shortLabel: 'Master 4', broadCategory: 'master', minAge: 46, maxAge: 50, matchDurationSeconds: 300 },
  { id: 'master_5', label: 'Master 5 (51 a 55 anos)', shortLabel: 'Master 5', broadCategory: 'master', minAge: 51, maxAge: 55, matchDurationSeconds: 300 },
  { id: 'master_6', label: 'Master 6+ (56+ anos)', shortLabel: 'Master 6+', broadCategory: 'master', minAge: 56, maxAge: null, matchDurationSeconds: 300 }
];

// Adulto e Master (Masculino e Feminino) — Com Quimono (Gi)
export const BJJ_ADULT_MASTER_M_GI = buildWeightSeries('bjj_am_m_gi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 57.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 64.0 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 70.0 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 76.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 82.3 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 88.3 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 94.3 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 100.5 },
  { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
]);

export const BJJ_ADULT_MASTER_F_GI = buildWeightSeries('bjj_am_f_gi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 48.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 53.5 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 58.5 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 64.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 69.0 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 74.0 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 79.3 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: null }
]);

// Adulto e Master — Sem Quimono (No-Gi)
export const BJJ_ADULT_MASTER_M_NOGI = buildWeightSeries('bjj_am_m_nogi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 55.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 61.5 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 67.5 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 73.5 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 79.5 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 85.5 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 91.5 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 97.5 },
  { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
]);

export const BJJ_ADULT_MASTER_F_NOGI = buildWeightSeries('bjj_am_f_nogi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 46.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 51.5 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 56.5 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 61.5 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 66.5 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 71.5 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 76.5 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: null }
]);

// Juvenil (16 e 17 anos) — Com Quimono (Gi)
export const BJJ_JUVENIL_M_GI = buildWeightSeries('bjj_juv_m_gi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 53.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 58.5 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 64.0 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 69.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 74.0 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 79.3 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 84.3 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 89.3 },
  { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
]);

export const BJJ_JUVENIL_F_GI = buildWeightSeries('bjj_juv_f_gi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 44.3 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 48.3 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 52.5 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 56.5 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 60.5 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 65.0 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 69.0 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: null }
]);

// Juvenil — Sem Quimono (No-Gi)
export const BJJ_JUVENIL_M_NOGI = buildWeightSeries('bjj_juv_m_nogi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 51.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 56.5 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 61.5 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 66.5 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 71.5 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 76.5 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 81.5 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 86.5 },
  { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
]);

export const BJJ_JUVENIL_F_NOGI = buildWeightSeries('bjj_juv_f_nogi', [
  { idSuffix: 'galo', name: 'Galo', maxWeight: 42.5 },
  { idSuffix: 'pluma', name: 'Pluma', maxWeight: 46.5 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 50.5 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 54.5 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 58.5 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 62.5 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 66.5 },
  { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: null }
]);

// Kids CBJJ/IBJJF (Pré-Mirim até Infanto-Juvenil B) — Fracionadas por idade exata (Com Quimono)
export const BJJ_KIDS_TABLES_GI: Record<
  'pre_mirim' | 'mirim' | 'infantil_a' | 'infantil_b' | 'infanto_juvenil_a' | 'infanto_juvenil_b',
  DivisionWeightOption[]
> = {
  pre_mirim: buildWeightSeries('bjj_premirim', [
    { idSuffix: 'galo', name: 'Galo', maxWeight: 14.7 },
    { idSuffix: 'pluma', name: 'Pluma', maxWeight: 17.0 },
    { idSuffix: 'pena', name: 'Pena', maxWeight: 19.5 },
    { idSuffix: 'leve', name: 'Leve', maxWeight: 22.0 },
    { idSuffix: 'medio', name: 'Médio', maxWeight: 24.5 },
    { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 27.0 },
    { idSuffix: 'pesado', name: 'Pesado', maxWeight: 29.5 },
    { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 32.0 },
    { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
  ]),
  mirim: buildWeightSeries('bjj_mirim', [
    { idSuffix: 'galo', name: 'Galo', maxWeight: 18.0 },
    { idSuffix: 'pluma', name: 'Pluma', maxWeight: 21.0 },
    { idSuffix: 'pena', name: 'Pena', maxWeight: 24.0 },
    { idSuffix: 'leve', name: 'Leve', maxWeight: 27.0 },
    { idSuffix: 'medio', name: 'Médio', maxWeight: 30.2 },
    { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 33.2 },
    { idSuffix: 'pesado', name: 'Pesado', maxWeight: 36.2 },
    { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 39.3 },
    { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
  ]),
  infantil_a: buildWeightSeries('bjj_infa', [
    { idSuffix: 'galo', name: 'Galo', maxWeight: 24.0 },
    { idSuffix: 'pluma', name: 'Pluma', maxWeight: 27.0 },
    { idSuffix: 'pena', name: 'Pena', maxWeight: 30.2 },
    { idSuffix: 'leve', name: 'Leve', maxWeight: 33.2 },
    { idSuffix: 'medio', name: 'Médio', maxWeight: 36.2 },
    { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 39.3 },
    { idSuffix: 'pesado', name: 'Pesado', maxWeight: 42.3 },
    { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 45.3 },
    { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
  ]),
  infantil_b: buildWeightSeries('bjj_infb', [
    { idSuffix: 'galo', name: 'Galo', maxWeight: 27.0 },
    { idSuffix: 'pluma', name: 'Pluma', maxWeight: 30.2 },
    { idSuffix: 'pena', name: 'Pena', maxWeight: 33.2 },
    { idSuffix: 'leve', name: 'Leve', maxWeight: 36.2 },
    { idSuffix: 'medio', name: 'Médio', maxWeight: 39.3 },
    { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 42.3 },
    { idSuffix: 'pesado', name: 'Pesado', maxWeight: 45.3 },
    { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 48.3 },
    { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
  ]),
  infanto_juvenil_a: buildWeightSeries('bjj_ijva', [
    { idSuffix: 'galo', name: 'Galo', maxWeight: 32.2 },
    { idSuffix: 'pluma', name: 'Pluma', maxWeight: 36.2 },
    { idSuffix: 'pena', name: 'Pena', maxWeight: 40.3 },
    { idSuffix: 'leve', name: 'Leve', maxWeight: 44.3 },
    { idSuffix: 'medio', name: 'Médio', maxWeight: 48.3 },
    { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 52.5 },
    { idSuffix: 'pesado', name: 'Pesado', maxWeight: 56.5 },
    { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 60.5 },
    { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
  ]),
  infanto_juvenil_b: buildWeightSeries('bjj_ijvb', [
    { idSuffix: 'galo', name: 'Galo', maxWeight: 40.3 },
    { idSuffix: 'pluma', name: 'Pluma', maxWeight: 44.3 },
    { idSuffix: 'pena', name: 'Pena', maxWeight: 48.3 },
    { idSuffix: 'leve', name: 'Leve', maxWeight: 52.5 },
    { idSuffix: 'medio', name: 'Médio', maxWeight: 56.5 },
    { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 60.5 },
    { idSuffix: 'pesado', name: 'Pesado', maxWeight: 65.0 },
    { idSuffix: 'super_pesado', name: 'Super Pesado', maxWeight: 69.0 },
    { idSuffix: 'pesadissimo', name: 'Pesadíssimo', maxWeight: null }
  ])
};

// ---------------------------------------------------------------------------
// 2. CATEGORIAS DE IDADE E PESO DAS DEMAIS 7 ARTES MARCIAIS
// ---------------------------------------------------------------------------

export const ART_AGE_DIVISIONS: Record<Exclude<MartialArtType, 'jiujitsu'>, SportAgeDivision[]> = {
  judo: [
    { id: 'sub_11', label: 'Sub-11 (9 e 10 anos)', shortLabel: 'Sub-11', broadCategory: 'infantil', minAge: 6, maxAge: 10 },
    { id: 'sub_13', label: 'Sub-13 (11 e 12 anos)', shortLabel: 'Sub-13', broadCategory: 'infantil', minAge: 11, maxAge: 12 },
    { id: 'sub_15', label: 'Sub-15 (13 e 14 anos)', shortLabel: 'Sub-15', broadCategory: 'juvenil', minAge: 13, maxAge: 14 },
    { id: 'sub_18', label: 'Sub-18 Cadete (15 a 17 anos)', shortLabel: 'Sub-18', broadCategory: 'juvenil', minAge: 15, maxAge: 17 },
    { id: 'sub_21', label: 'Sub-21 Júnior (18 a 20 anos)', shortLabel: 'Sub-21', broadCategory: 'adulto', minAge: 18, maxAge: 20 },
    { id: 'senior', label: 'Sênior (21 a 29 anos)', shortLabel: 'Sênior', broadCategory: 'adulto', minAge: 21, maxAge: 29 },
    { id: 'veteranos', label: 'Veteranos / Master (30+ anos)', shortLabel: 'Veteranos', broadCategory: 'master', minAge: 30, maxAge: null }
  ],
  karate: [
    { id: 'sub_12', label: 'Sub-12 (8 a 11 anos)', shortLabel: 'Sub-12', broadCategory: 'infantil', minAge: 6, maxAge: 11 },
    { id: 'sub_14', label: 'Sub-14 (12 e 13 anos)', shortLabel: 'Sub-14', broadCategory: 'infantil', minAge: 12, maxAge: 13 },
    { id: 'cadete', label: 'Cadete WKF (14 e 15 anos)', shortLabel: 'Cadete', broadCategory: 'juvenil', minAge: 14, maxAge: 15 },
    { id: 'junior', label: 'Júnior WKF (16 e 17 anos)', shortLabel: 'Júnior', broadCategory: 'juvenil', minAge: 16, maxAge: 17 },
    { id: 'sub_21', label: 'Sub-21 (18 a 20 anos)', shortLabel: 'Sub-21', broadCategory: 'adulto', minAge: 18, maxAge: 20 },
    { id: 'senior', label: 'Sênior WKF (21 a 34 anos)', shortLabel: 'Sênior', broadCategory: 'adulto', minAge: 21, maxAge: 34 },
    { id: 'master', label: 'Master (35+ anos)', shortLabel: 'Master', broadCategory: 'master', minAge: 35, maxAge: null }
  ],
  boxe: [
    { id: 'infantil', label: 'Infantil / Escolar (10 a 12 anos)', shortLabel: 'Escolar', broadCategory: 'infantil', minAge: 8, maxAge: 12 },
    { id: 'cadete', label: 'Cadete (13 e 14 anos)', shortLabel: 'Cadete', broadCategory: 'infantil', minAge: 13, maxAge: 14 },
    { id: 'juvenil', label: 'Juvenil (15 e 16 anos)', shortLabel: 'Juvenil', broadCategory: 'juvenil', minAge: 15, maxAge: 16 },
    { id: 'youth', label: 'Júnior / Youth (17 e 18 anos)', shortLabel: 'Youth', broadCategory: 'juvenil', minAge: 17, maxAge: 18 },
    { id: 'elite', label: 'Elite (19 a 34 anos)', shortLabel: 'Elite', broadCategory: 'adulto', minAge: 19, maxAge: 34 },
    { id: 'master', label: 'Master (35+ anos)', shortLabel: 'Master', broadCategory: 'master', minAge: 35, maxAge: null }
  ],
  muaythai: [
    { id: 'kids', label: 'Kids (8 a 13 anos)', shortLabel: 'Kids', broadCategory: 'infantil', minAge: 6, maxAge: 13 },
    { id: 'juvenil', label: 'Juvenil / Youth (14 a 17 anos)', shortLabel: 'Juvenil', broadCategory: 'juvenil', minAge: 14, maxAge: 17 },
    { id: 'adulto', label: 'Adulto / Classe A-B (18 a 34 anos)', shortLabel: 'Adulto', broadCategory: 'adulto', minAge: 18, maxAge: 34 },
    { id: 'master', label: 'Veterano / Master (35+ anos)', shortLabel: 'Master', broadCategory: 'master', minAge: 35, maxAge: null }
  ],
  capoeira: [
    { id: 'mirim_infantil', label: 'Mirim / Infantil (6 a 13 anos)', shortLabel: 'Infantil', broadCategory: 'infantil', minAge: 4, maxAge: 13 },
    { id: 'juvenil', label: 'Juvenil (14 a 17 anos)', shortLabel: 'Juvenil', broadCategory: 'juvenil', minAge: 14, maxAge: 17 },
    { id: 'adulto', label: 'Adulto (18 a 34 anos)', shortLabel: 'Adulto', broadCategory: 'adulto', minAge: 18, maxAge: 34 },
    { id: 'master', label: 'Sênior / Master (35+ anos)', shortLabel: 'Master', broadCategory: 'master', minAge: 35, maxAge: null }
  ],
  lutalivre: [
    { id: 'infantil', label: 'Infantil (8 a 13 anos)', shortLabel: 'Infantil', broadCategory: 'infantil', minAge: 6, maxAge: 13 },
    { id: 'juvenil', label: 'Juvenil (14 a 17 anos)', shortLabel: 'Juvenil', broadCategory: 'juvenil', minAge: 14, maxAge: 17 },
    { id: 'adulto', label: 'Adulto (18 a 29 anos)', shortLabel: 'Adulto', broadCategory: 'adulto', minAge: 18, maxAge: 29 },
    { id: 'master', label: 'Master (30+ anos)', shortLabel: 'Master', broadCategory: 'master', minAge: 30, maxAge: null }
  ],
  mma: [
    { id: 'adulto', label: 'Adulto / Profissional (18 a 34 anos)', shortLabel: 'Adulto', broadCategory: 'adulto', minAge: 18, maxAge: 34 },
    { id: 'veterano', label: 'Veterano / Master (35+ anos)', shortLabel: 'Master', broadCategory: 'master', minAge: 35, maxAge: null }
  ]
};

export const GENERIC_YOUTH_WEIGHTS = buildWeightSeries('youth_gen', [
  { idSuffix: 'mosca_jr', name: 'Mosca Júnior', maxWeight: 36.0 },
  { idSuffix: 'galo_jr', name: 'Galo Júnior', maxWeight: 42.0 },
  { idSuffix: 'pena_jr', name: 'Pena Júnior', maxWeight: 48.0 },
  { idSuffix: 'leve_jr', name: 'Leve Júnior', maxWeight: 54.0 },
  { idSuffix: 'medio_jr', name: 'Médio Júnior', maxWeight: 60.0 },
  { idSuffix: 'meio_pesado_jr', name: 'Meio-Pesado Júnior', maxWeight: 67.0 },
  { idSuffix: 'pesado_jr', name: 'Pesado Júnior', maxWeight: null }
]);

export const JUDO_M_SENIOR = buildWeightSeries('judo_m', [
  { idSuffix: 'ligeiro', name: 'Ligeiro', maxWeight: 60.0 },
  { idSuffix: 'meio_leve', name: 'Meio-Leve', maxWeight: 66.0 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 73.0 },
  { idSuffix: 'meio_medio', name: 'Meio-Médio', maxWeight: 81.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 90.0 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 100.0 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: null }
]);

export const JUDO_F_SENIOR = buildWeightSeries('judo_f', [
  { idSuffix: 'ligeiro', name: 'Ligeiro', maxWeight: 48.0 },
  { idSuffix: 'meio_leve', name: 'Meio-Leve', maxWeight: 52.0 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 57.0 },
  { idSuffix: 'meio_medio', name: 'Meio-Médio', maxWeight: 63.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 70.0 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 78.0 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: null }
]);

export const KARATE_M_SENIOR = buildWeightSeries('wkf_m', [
  { idSuffix: 'k60', name: '-60 kg (Kumitê)', maxWeight: 60.0 },
  { idSuffix: 'k67', name: '-67 kg (Kumitê)', maxWeight: 67.0 },
  { idSuffix: 'k75', name: '-75 kg (Kumitê)', maxWeight: 75.0 },
  { idSuffix: 'k84', name: '-84 kg (Kumitê)', maxWeight: 84.0 },
  { idSuffix: 'k84p', name: '+84 kg (Pesado)', maxWeight: null }
]);

export const KARATE_F_SENIOR = buildWeightSeries('wkf_f', [
  { idSuffix: 'k50', name: '-50 kg (Kumitê)', maxWeight: 50.0 },
  { idSuffix: 'k55', name: '-55 kg (Kumitê)', maxWeight: 55.0 },
  { idSuffix: 'k61', name: '-61 kg (Kumitê)', maxWeight: 61.0 },
  { idSuffix: 'k68', name: '-68 kg (Kumitê)', maxWeight: 68.0 },
  { idSuffix: 'k68p', name: '+68 kg (Pesado)', maxWeight: null }
]);

export const STRIKING_MMA_M_ADULT = buildWeightSeries('str_m', [
  { idSuffix: 'mosca', name: 'Mosca', maxWeight: 56.7 },
  { idSuffix: 'galo', name: 'Galo', maxWeight: 61.2 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 65.8 },
  { idSuffix: 'leve', name: 'Leve', maxWeight: 70.3 },
  { idSuffix: 'meio_medio', name: 'Meio-Médio', maxWeight: 77.1 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 83.9 },
  { idSuffix: 'meio_pesado', name: 'Meio-Pesado', maxWeight: 93.0 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 120.2 }
]);

export const STRIKING_MMA_F_ADULT = buildWeightSeries('str_f', [
  { idSuffix: 'palha', name: 'Palha', maxWeight: 52.2 },
  { idSuffix: 'mosca', name: 'Mosca', maxWeight: 56.7 },
  { idSuffix: 'galo', name: 'Galo', maxWeight: 61.2 },
  { idSuffix: 'pena', name: 'Pena', maxWeight: 65.8 },
  { idSuffix: 'leve', name: 'Leve / Aberto', maxWeight: null }
]);

export const CAPOEIRA_M_ADULT = buildWeightSeries('cap_m', [
  { idSuffix: 'leve', name: 'Leve', maxWeight: 68.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 78.0 },
  { idSuffix: 'pesado', name: 'Pesado', maxWeight: 88.0 },
  { idSuffix: 'absoluto', name: 'Pesadíssimo / Absoluto', maxWeight: null }
]);

export const CAPOEIRA_F_ADULT = buildWeightSeries('cap_f', [
  { idSuffix: 'leve', name: 'Leve', maxWeight: 58.0 },
  { idSuffix: 'medio', name: 'Médio', maxWeight: 68.0 },
  { idSuffix: 'pesado', name: 'Pesado / Absoluto', maxWeight: null }
]);
