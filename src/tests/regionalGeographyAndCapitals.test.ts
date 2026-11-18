import assert from 'node:assert/strict';
import { BRAZIL_CAPITALS_COUNT, BRAZIL_STATES, getCapitalByCity, getStateByUf } from '../data/brazilLocations';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import {
  calculateGeoDistanceKm,
  estimateTravelLogistics,
  getAllPlayableCapitals,
  getCapitalProfileSummary,
  isStrictPlayableCapital,
  resolveBrazilCapitalByCity,
  resolveBrazilCapitalByUf
} from '../utils/regionalGeographyHelper';

console.log('🧪 Executando testes da Etapa 2: Matriz das 27 Capitais, Índices Coerentes & Distâncias...');

// ===========================================================================
// 1. INTEGRIDADE ESTRITA DAS 27 LOCALIDADES JOGÁVEIS (26 CAPITAIS + DF)
// ===========================================================================
{
  assert.equal(BRAZIL_STATES.length, 27, 'O mundo brasileiro deve conter exatamente 27 localidades (26 estados + DF).');
  assert.equal(getAllPlayableCapitals().length, BRAZIL_CAPITALS_COUNT);

  const uniqueUfs = new Set(BRAZIL_STATES.map((s) => s.uf));
  const uniqueCapitals = new Set(BRAZIL_STATES.map((s) => s.capital));
  assert.equal(uniqueUfs.size, 27, 'Todas as 27 UFs devem ser únicas.');
  assert.equal(uniqueCapitals.size, 27, 'Todas as 27 capitais devem ser únicas.');

  const expectedCapitals = [
    'Rio Branco', 'Maceió', 'Macapá', 'Manaus', 'Salvador', 'Fortaleza', 'Brasília',
    'Vitória', 'Goiânia', 'São Luís', 'Cuiabá', 'Campo Grande', 'Belo Horizonte',
    'Belém', 'João Pessoa', 'Curitiba', 'Recife', 'Teresina', 'Rio de Janeiro',
    'Natal', 'Porto Alegre', 'Porto Velho', 'Boa Vista', 'Florianópolis',
    'São Paulo', 'Aracaju', 'Palmas'
  ];

  for (const cap of expectedCapitals) {
    assert.ok(isStrictPlayableCapital(cap), `Capital "${cap}" deve ser reconhecida estritamente como jogável.`);
    assert.ok(getCapitalByCity(cap), `getCapitalByCity("${cap}") deve retornar registro completo.`);
  }

  for (const s of BRAZIL_STATES) {
    // Coordenadas dentro da faixa geográfica do Brasil
    assert.ok(s.coordinates.lat >= -34 && s.coordinates.lat <= 6, `Latitude válida para ${s.capital}`);
    assert.ok(s.coordinates.lng >= -74 && s.coordinates.lng <= -32, `Longitude válida para ${s.capital}`);

    // Economia coerente (valores positivos e proporcionais)
    assert.ok(s.economy.costOfLivingIndex >= 0.75 && s.economy.costOfLivingIndex <= 1.45);
    assert.ok(s.economy.housingBase >= 300 && s.economy.housingBase <= 750);
    assert.ok(s.economy.foodBase >= 200 && s.economy.foodBase <= 400);
    assert.ok(s.economy.transportBase >= 80 && s.economy.transportBase <= 250);
    assert.ok(s.economy.healthBase >= 80 && s.economy.healthBase <= 220);
    assert.ok(s.economy.salaryMultiplier >= 0.75 && s.economy.salaryMultiplier <= 1.4);
    assert.ok(s.economy.educationMultiplier >= 0.75 && s.economy.educationMultiplier <= 1.4);
    assert.ok(s.economy.gymTuitionMultiplier >= 0.75 && s.economy.gymTuitionMultiplier <= 1.4);

    // Esporte e artes dominantes válidos
    assert.ok(s.sport.sportDevelopmentIndex >= 40 && s.sport.sportDevelopmentIndex <= 100);
    assert.ok(s.sport.dominantArts.length >= 2 && s.sport.dominantArts.length <= 4);
    for (const art of s.sport.dominantArts) {
      assert.ok(MARTIAL_ARTS_META[art], `Arte dominante válida (${art}) em ${s.capital}`);
    }
    assert.ok(s.sport.economicIdentity.length > 20);
    assert.ok(s.sport.jobOpportunityLabel.length > 10);

    const summary = getCapitalProfileSummary(s.uf);
    assert.equal(summary.state.uf, s.uf);
    assert.ok(summary.monthlyBaseLivingTotal > 700, `Custo base somado coerente em ${s.capital}`);
  }

  console.log('✅ 1. Todas as 27 capitais validadas com coordenadas, economia e infraestrutura esportiva.');
}

// ===========================================================================
// 2. COERÊNCIA ECONÔMICA REGIONAL (SEM MULTIPLICADORES ALEATÓRIOS)
// ===========================================================================
{
  const sp = getStateByUf('SP');
  const df = getStateByUf('DF');
  const rj = getStateByUf('RJ');
  const pi = getStateByUf('PI');
  const ac = getStateByUf('AC');

  assert.ok(sp.economy.housingBase > pi.economy.housingBase, 'Moradia em SP deve superar Teresina-PI.');
  assert.ok(df.economy.costOfLivingIndex > ac.economy.costOfLivingIndex, 'Brasília deve ter custo maior que Rio Branco.');
  assert.ok(rj.sport.sportDevelopmentIndex > ac.sport.sportDevelopmentIndex, 'RJ deve ter índice esportivo maior que AC.');
  assert.ok(sp.economy.salaryMultiplier > pi.economy.salaryMultiplier, 'SP deve ter multiplicador salarial maior que PI.');
  assert.ok(sp.sport.sponsorshipMarketIndex > pi.sport.sponsorshipMarketIndex, 'SP deve ter mercado de patrocínio maior que PI.');

  console.log('✅ 2. Coerência econômica e esportiva entre capitais verificada.');
}

// ===========================================================================
// 3. NORMALIZAÇÃO DE ALIASES E LIMITE ESTRITO CONTRA INTERIOR
// ===========================================================================
{
  assert.equal(isStrictPlayableCapital('Campinas'), false, 'Cidade do interior não é localidade jogável.');
  assert.equal(isStrictPlayableCapital('Salvador da Bahia'), false, 'Alias legado deve ser normalizado para Salvador.');

  assert.equal(resolveBrazilCapitalByCity('Salvador da Bahia').capital, 'Salvador');
  assert.equal(resolveBrazilCapitalByCity('Campinas').uf, 'SP');
  assert.equal(resolveBrazilCapitalByCity('Niterói').capital, 'Rio de Janeiro');
  assert.equal(resolveBrazilCapitalByCity('Londrina').capital, 'Curitiba');
  assert.equal(resolveBrazilCapitalByCity('Joinville').capital, 'Florianópolis');
  assert.equal(resolveBrazilCapitalByCity('Feira de Santana').capital, 'Salvador');
  assert.equal(resolveBrazilCapitalByCity('Comunidade Local', 'AM').capital, 'Manaus');
  assert.equal(resolveBrazilCapitalByUf('df').capital, 'Brasília');

  console.log('✅ 3. Normalização de aliases legados e bloqueio estrito de interior verificados.');
}

// ===========================================================================
// 4. DISTÂNCIA HAVERSINE E LOGÍSTICA DE VIAGEM (LOCAL, REGIONAL, NACIONAL, EXTERIOR)
// ===========================================================================
{
  const localTrip = estimateTravelLogistics(
    { country: 'Brasil', uf: 'BA', city: 'Salvador' },
    { country: 'Brasil', uf: 'BA', city: 'Salvador da Bahia' }
  );
  assert.equal(localTrip.isSameCapital, true);
  assert.equal(localTrip.distanceKm, 0);
  assert.equal(localTrip.estimatedCost, 0);
  assert.equal(localTrip.travelDays, 0);

  const spToRj = estimateTravelLogistics(
    { country: 'Brasil', uf: 'SP', city: 'São Paulo' },
    { country: 'Brasil', uf: 'RJ', city: 'Rio de Janeiro' }
  );
  assert.ok(spToRj.distanceKm >= 330 && spToRj.distanceKm <= 400, `SP->RJ ~357km (atual: ${spToRj.distanceKm})`);
  assert.equal(spToRj.scopeCategory, 'regional_curta');
  assert.equal(spToRj.transportMode, 'rodoviario');
  assert.ok(spToRj.estimatedCost > 0 && spToRj.estimatedCost < 350);

  const spToManaus = estimateTravelLogistics(
    { country: 'Brasil', uf: 'SP', city: 'São Paulo' },
    { country: 'Brasil', uf: 'AM', city: 'Manaus' }
  );
  assert.ok(spToManaus.distanceKm > 2500 && spToManaus.distanceKm < 2900, `SP->Manaus ~2689km (atual: ${spToManaus.distanceKm})`);
  assert.equal(spToManaus.scopeCategory, 'nacional_longa');
  assert.equal(spToManaus.transportMode, 'aereo_nacional');
  assert.equal(spToManaus.travelDays, 2);

  const spToTokyo = estimateTravelLogistics(
    { country: 'Brasil', uf: 'SP', city: 'São Paulo' },
    { country: 'Japão', city: 'Tóquio' }
  );
  assert.equal(spToTokyo.isInternational, true);
  assert.equal(spToTokyo.scopeCategory, 'internacional');
  assert.equal(spToTokyo.transportMode, 'aereo_internacional');
  assert.ok(spToTokyo.distanceKm > 17000);
  assert.ok(spToTokyo.estimatedCost >= 2500);

  const directKm = calculateGeoDistanceKm(getStateByUf('PE').coordinates, getStateByUf('CE').coordinates);
  assert.ok(directKm > 550 && directKm < 700, `Recife->Fortaleza ~630km (atual: ${directKm})`);

  console.log('✅ 4. Distâncias geográficas e logística de viagens validadas.');
}

console.log('🎉 TODOS OS TESTES DA ETAPA 2 CONCLUÍDOS COM SUCESSO!');
