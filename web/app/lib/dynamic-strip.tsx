import { ImageResponse } from 'next/og';

export type DynamicStripParams = {
  businessName: string;
  currentVisits: number;
  requiredVisits: number;
  bgColor: string;
  fgColor: string;
  labelColor: string;
  stripImageData?: string;
  prizeEmoji?: string;
  milestones: Array<{ visitTarget: number; emoji: string; reward: string }>;
};

const WIDTH = 1032;
const HEIGHT = 336;

// Cache font buffer in module scope so we only fetch once per cold start
let _cachedFontBuffer: ArrayBuffer | null = null;

async function getFontBuffer(): Promise<ArrayBuffer | undefined> {
  if (_cachedFontBuffer) return _cachedFontBuffer;
  try {
    const res = await fetch(
      'https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff'
    );
    if (!res.ok) throw new Error('fetch failed');
    _cachedFontBuffer = await res.arrayBuffer();
    return _cachedFontBuffer;
  } catch {
    return undefined;
  }
}

export async function generateDynamicStripResponse({
  businessName,
  currentVisits,
  requiredVisits,
  bgColor,
  fgColor,
  labelColor,
  stripImageData = '',
  prizeEmoji = '\u{1F3C6}',
  milestones,
}: DynamicStripParams): Promise<ImageResponse> {
  const fontData = await getFontBuffer();

  const maxVisits = Math.max(requiredVisits, currentVisits, 1);
  const nodes = Array.from({ length: maxVisits }, (_, i) => {
    const visitIndex = i + 1;
    const isAchieved = visitIndex <= currentVisits;
    const milestone = milestones.find((m) => m.visitTarget === visitIndex);
    return { visitIndex, isAchieved, milestone };
  });
  const rows: Array<typeof nodes> = [];

  for (let index = 0; index < nodes.length; index += 6) {
    rows.push(nodes.slice(index, index + 6));
  }

  const fontsConfig = fontData
    ? [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '22px 32px 18px',
          fontFamily: fontsConfig ? 'Inter' : 'sans-serif',
        }}
      >
        {stripImageData ? (
          <img
            src={stripImageData}
            alt="Wallet strip background"
            style={{
              position: 'absolute',
              inset: '0',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background: stripImageData
              ? `linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.34) 100%)`
              : 'transparent',
          }}
        />

        <div
          style={{
            display: 'flex',
            position: 'relative',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: rows.length > 1 ? '14px' : '8px',
            flex: '1 1 auto',
          }}
        >
          {rows.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                gap: '18px',
              }}
            >
              {row.map((node) => {
                const hasMilestone = !!node.milestone;
                const isFinalNode = node.visitIndex === maxVisits;
                const showLabel = hasMilestone || isFinalNode;
                const labelText = hasMilestone
                  ? (node.milestone?.reward ?? '')
                  : 'PREMIO FINAL';

                return (
                  <div
                    key={node.visitIndex}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      position: 'relative',
                      width: '140px',
                      minHeight: '130px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        backgroundColor: node.isAchieved ? labelColor : 'rgba(255,255,255,0.8)',
                        boxShadow:
                          node.isAchieved && hasMilestone
                            ? `0 0 20px ${labelColor}`
                            : '0 4px 10px rgba(0,0,0,0.22)',
                        border: '4px solid rgba(255,255,255,0.92)',
                      }}
                    >
                      {hasMilestone ? (
                        <span style={{ fontSize: '42px', display: 'flex' }}>
                          {node.milestone?.emoji ?? '\u{1F381}'}
                        </span>
                      ) : isFinalNode ? (
                        <span style={{ fontSize: '40px', display: 'flex' }}>
                          {prizeEmoji}
                        </span>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '58px',
                            height: '58px',
                            borderRadius: '50%',
                            backgroundColor: node.isAchieved ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.88)',
                            opacity: node.isAchieved ? 0.9 : 0.72,
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: node.isAchieved ? labelColor : fgColor,
                          }}
                        >
                          {node.isAchieved ? '\u2713' : String(node.visitIndex)}
                        </div>
                      )}
                    </div>

                    {showLabel && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          width: '136px',
                          marginTop: '8px',
                          minHeight: '28px',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            lineHeight: 1.15,
                            textShadow: '0 2px 4px rgba(0,0,0,0.48)',
                          }}
                        >
                          {labelText}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '20px',
            marginTop: '8px',
            fontWeight: 800,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            backgroundColor: 'rgba(0,0,0,0.18)',
            borderRadius: '999px',
            padding: '6px 18px',
          }}
        >
          {businessName} \u00B7 Progreso: {currentVisits}/{requiredVisits} Visitas
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fontsConfig,
    }
  );
}
