import React from 'react';
import { getBjjBeltRibbonColors, getBjjMaxStripes } from '../utils/bjjDegreeHelper';

interface Props {
  rankIndex: number;
  stripes?: number;
  label?: string;
  compact?: boolean;
}

export const BjjBeltVisual: React.FC<Props> = ({
  rankIndex,
  stripes = 0,
  label,
  compact = false
}) => {
  const maxStripes = getBjjMaxStripes(rankIndex);
  const safeStripes = Math.max(0, Math.min(maxStripes, Math.floor(stripes || 0)));
  const colors = getBjjBeltRibbonColors(rankIndex);

  return (
    <div className={compact ? 'inline-flex items-center gap-2' : 'space-y-1.5'}>
      <div
        className={`relative flex items-center justify-between rounded-md border border-white/20 overflow-hidden shadow-xs ${
          compact ? 'h-5 min-w-[92px]' : 'h-7 w-full'
        }`}
        style={{ background: colors.beltBg }}
        title={label || `${safeStripes}º Grau`}
      >
        {label && !compact && (
          <span
            className="px-2.5 text-[11px] font-black truncate z-10"
            style={{ color: colors.textColor }}
          >
            {label}
          </span>
        )}
        {compact && <span className="flex-1" />}

        {/* Ponteira oficial da faixa com os graus individuais */}
        {maxStripes > 0 && (
          <div
            className={`h-full flex items-center justify-center gap-0.5 px-1.5 shrink-0 border-l border-white/20 ${
              compact ? 'min-w-[34px]' : 'min-w-[54px]'
            }`}
            style={{ backgroundColor: colors.tipBg }}
          >
            {Array.from({ length: maxStripes }).map((_, idx) => {
              const filled = idx < safeStripes;
              return (
                <span
                  key={idx}
                  className={`${compact ? 'w-1 h-3' : 'w-1.5 h-4'} rounded-[1px] transition-opacity ${
                    filled ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ backgroundColor: colors.stripeColor }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
