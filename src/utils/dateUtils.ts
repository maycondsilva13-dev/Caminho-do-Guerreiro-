export interface GameDate {
  day: number;
  month: number; // 1 a 12
  year: number;
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export const MONTH_ABBR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez'
];

/**
 * Determina se um ano é bissexto segundo as regras do calendário gregoriano.
 * Divisível por 4, exceto múltiplos de 100 que não sejam divisíveis por 400.
 */
export function isLeapYear(year: number): boolean {
  if (year <= 0) return false;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Retorna o número de dias exatos de um mês específico, respeitando anos bissextos em fevereiro.
 */
export function getDaysInMonth(month: number, year: number): number {
  if (month < 1 || month > 12) return 30;
  switch (month) {
    case 1: // Janeiro
    case 3: // Março
    case 5: // Maio
    case 7: // Julho
    case 8: // Agosto
    case 10: // Outubro
    case 12: // Dezembro
      return 31;
    case 4: // Abril
    case 6: // Junho
    case 9: // Setembro
    case 11: // Novembro
      return 30;
    case 2: // Fevereiro
      return isLeapYear(year) ? 29 : 28;
    default:
      return 30;
  }
}

/**
 * Valida se um dia, mês e ano formam uma data do calendário válida.
 */
export function isValidDate(day: number, month: number, year: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return false;
  }
  if (year < 1920 || year > 2050) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(month, year);
  return day >= 1 && day <= maxDays;
}

/**
 * Calcula a idade com precisão cirúrgica a partir da data de nascimento e da data atual do jogo.
 * A idade NÃO aumenta na virada do ano civil, apenas quando o aniversário é atingido no calendário.
 * Para pessoas nascidas em 29 de fevereiro, em anos não bissextos o aniversário é considerado em 28 de fevereiro.
 */
export function calculateAge(birthDate: GameDate, currentDate: GameDate): number {
  let age = currentDate.year - birthDate.year;

  // Se nasceu em 29 de fevereiro e o ano corrente NÃO for bissexto, o aniversário ocorre em 28 de fevereiro
  const isBornFeb29 = birthDate.month === 2 && birthDate.day === 29;
  const anniversaryDay = (isBornFeb29 && !isLeapYear(currentDate.year)) ? 28 : birthDate.day;

  if (
    currentDate.month < birthDate.month ||
    (currentDate.month === birthDate.month && currentDate.day < anniversaryDay)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

/**
 * Calcula a data exata de início da carreira com base no nascimento e na idade inicial escolhida.
 * Trata casos especiais como 29 de fevereiro quando o ano de início não for bissexto (ajusta para 28 de fevereiro).
 */
export function calculateCareerStartDate(birthDate: GameDate, startAge: number): GameDate {
  const startYear = birthDate.year + startAge;
  const maxDaysInMonth = getDaysInMonth(birthDate.month, startYear);
  const startDay = Math.min(birthDate.day, maxDaysInMonth);

  return {
    day: startDay,
    month: birthDate.month,
    year: startYear
  };
}

/**
 * Avança a data em exatamente 1 mês civil.
 * Conforme a regra do calendário civil do jogo:
 * - O próximo mês sempre se inicia no dia 01 (ex: qualquer dia de outubro -> 01/11 do mesmo ano).
 * - Se a data atual estiver em dezembro (mês 12), a próxima data mensal será 01/01 do ano seguinte.
 * - Preserva a integridade do calendário gregoriano e dos anos bissextos.
 */
export function advanceDateByMonth(currentDate: GameDate, _anchorDay?: number): GameDate {
  let newMonth = currentDate.month + 1;
  let newYear = currentDate.year;

  if (newMonth > 12) {
    newMonth = 1;
    newYear += 1;
  }

  return {
    day: 1,
    month: newMonth,
    year: newYear
  };
}

/**
 * Verifica se a data atual do jogo coincide com o mês e dia de aniversário do atleta.
 */
export function isBirthdayThisMonth(birthDate: GameDate, currentDate: GameDate): boolean {
  return birthDate.month === currentDate.month;
}

/**
 * Formata a data do jogo de maneira legível em português.
 */
export function formatGameDate(
  date: GameDate,
  style: 'full' | 'short' | 'monthYear' | 'dayMonth' = 'full'
): string {
  const monthName = MONTH_NAMES[date.month - 1] || 'Mês';
  const monthAbbr = MONTH_ABBR[date.month - 1] || 'Mês';

  switch (style) {
    case 'full':
      return `${date.day.toString().padStart(2, '0')} de ${monthName} de ${date.year}`;
    case 'short':
      return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
    case 'monthYear':
      return `${monthName} de ${date.year}`;
    case 'dayMonth':
      return `${date.day.toString().padStart(2, '0')} de ${monthAbbr}`;
    default:
      return `${date.day}/${date.month}/${date.year}`;
  }
}

/**
 * Formata o tempo de carreira decorrido a partir do número de meses totais de carreira.
 * Ex: 0 meses -> "Início da Carreira (Mês 1)"
 * Ex: 5 meses -> "5 meses de carreira (Ano 1)"
 * Ex: 14 meses -> "1 ano e 2 meses de carreira (Ano 2)"
 */
export function formatCareerDuration(monthsElapsed: number): string {
  const years = Math.floor(monthsElapsed / 12);
  const remainingMonths = monthsElapsed % 12;
  const careerYearNumber = years + 1;

  if (monthsElapsed === 0) {
    return `Ano 1 de Carreira (Mês de estreia)`;
  }

  if (years === 0) {
    return `${monthsElapsed} ${monthsElapsed === 1 ? 'mês' : 'meses'} de carreira (Ano 1)`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'} de carreira (Ano ${careerYearNumber})`;
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${
    remainingMonths === 1 ? 'mês' : 'meses'
  } de carreira (Ano ${careerYearNumber})`;
}

/**
 * Retorna o dia da semana do primeiro dia do mês (0 = Domingo, 1 = Segunda, ..., 6 = Sábado).
 */
export function getFirstDayOfWeek(month: number, year: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Retorna o mês e ano anteriores para consulta visual sem alterar o estado do jogo.
 */
export function getPreviousMonthYear(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Retorna o próximo mês e ano para consulta visual sem alterar o estado do jogo.
 */
export function getNextMonthYear(month: number, year: number): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
}
