import { ImageResponse } from 'next/og';

/* eslint-disable @next/next/no-img-element */

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
  businessName: _businessName,
  currentVisits,
  requiredVisits,
  bgColor,
  fgColor: _fgColor,
  labelColor,
  stripImageData = '',
  prizeEmoji = '\u{1F3C6}',
  milestones,
}: DynamicStripParams): Promise<ImageResponse> {
  void _businessName;
  void _fgColor;
  const fontData = await getFontBuffer();

  const maxVisits = Math.max(requiredVisits, currentVisits, 1);
  const nodes = Array.from({ length: maxVisits }, (_, i) => {
    const visitIndex = i + 1;
    const isAchieved = visitIndex <= currentVisits;
    const milestone = milestones.find((m) => m.visitTarget === visitIndex);
    return { visitIndex, isAchieved, milestone };
  });
  const rows: Array<typeof nodes> = [];

  for (let index = 0; index < nodes.length; index += 5) {
    rows.push(nodes.slice(index, index + 5));
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
            gap: rows.length > 1 ? '10px' : '6px',
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
                gap: '14px',
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
                      width: '166px',
                      minHeight: '110px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        backgroundColor: node.isAchieved ? labelColor : 'rgba(255,255,255,0.78)',
                        boxShadow:
                          node.isAchieved
                            ? `0 0 22px ${labelColor}`
                            : '0 10px 22px rgba(0,0,0,0.28)',
                        border: `4px solid ${node.isAchieved ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)'}`,
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
                            background:
                              node.isAchieved
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.14) 100%)'
                                : 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.78) 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 6px 14px rgba(0,0,0,0.26)',
                            border: `2px solid ${node.isAchieved ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.3)'}`,
                            fontSize: '28px',
                            fontWeight: 900,
                            color: '#FFFFFF',
                            textShadow: '0 2px 8px rgba(0,0,0,0.62)',
                          }}
                        >
                          {String(node.visitIndex)}
                        </div>
                      )}
                    </div>

                    {showLabel && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          width: '150px',
                          marginTop: '6px',
                          minHeight: '22px',
                          padding: '4px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(17,24,39,0.34)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '0.9px',
                            lineHeight: 1.08,
                            textShadow: '0 2px 6px rgba(0,0,0,0.6)',
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

      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fontsConfig,
    }
  );
}
