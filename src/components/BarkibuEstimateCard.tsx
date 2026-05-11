import { ShieldCheck } from 'lucide-react';
import type { BarkibuSupportEstimate } from '../data/barkibuEstimate';

function formatEuro(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

interface BarkibuEstimateCardProps {
  estimate: BarkibuSupportEstimate;
  compact?: boolean;
}

export function BarkibuEstimateCard({ estimate, compact = false }: BarkibuEstimateCardProps) {
  const visibleItems = estimate.lineItems.slice(0, compact ? 4 : 7);
  const hiddenCount = estimate.lineItems.length - visibleItems.length;

  return (
    <div
      className="plush-lg"
      style={{
        padding: compact ? 16 : 18,
        marginBottom: compact ? 0 : 22,
        background: 'var(--sky)',
        border: '1px solid rgba(85,123,144,0.25)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="chip butter" style={{ marginBottom: 10 }}>
            <ShieldCheck size={14} /> Barkibu cost view
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: compact ? 20 : 24, lineHeight: 1.12 }}>
            Barkibu can help with the veterinary bill
          </h2>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>
            Educational estimate using the consultation actions recorded manually or matched from voice in this case.
          </div>
        </div>

        <div
          className="plush"
          style={{
            background: 'white',
            padding: 14,
            display: 'grid',
            gap: 8,
            minWidth: 0,
          }}
        >
          <MoneyRow label="Estimated bill" value={estimate.subtotal} />
          <MoneyRow label="Barkibu estimate" value={-estimate.estimatedCoveredAmount} tone="var(--mint-deep)" />
          <div style={{ height: 1, background: 'rgba(32,35,38,0.18)' }} />
          <MoneyRow label="Owner pays" value={estimate.estimatedOwnerCost} strong />
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 8,
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="plush"
            style={{
              background: 'white',
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              fontSize: 12,
              fontWeight: 800,
              minWidth: 0,
            }}
          >
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{formatEuro(item.amount)}</span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="plush" style={{ background: 'white', padding: '8px 10px', fontSize: 12, fontWeight: 800 }}>
            +{hiddenCount} more line item{hiddenCount === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', lineHeight: 1.45 }}>
        {estimate.disclaimer}
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
  tone = 'var(--ink)',
}: {
  label: string;
  value: number;
  strong?: boolean;
  tone?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, fontWeight: strong ? 900 : 800, color: 'var(--ink-2)' }}>{label}</span>
      <span style={{ fontSize: strong ? 20 : 15, fontWeight: 900, color: tone }}>
        {value < 0 ? `-${formatEuro(Math.abs(value))}` : formatEuro(value)}
      </span>
    </div>
  );
}
