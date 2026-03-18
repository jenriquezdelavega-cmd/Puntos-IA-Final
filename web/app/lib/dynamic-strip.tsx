import { ImageResponse } from 'next/og';

export type DynamicStripParams = {
  businessName: string;
  currentVisits: number;
  requiredVisits: number;
  bgColor: string;
  fgColor: string;
  labelColor: string;
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
    // Use the Inter font from bunny.net CDN (reliable, no CORS issues)
    const res = await fetch(
      'https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff'
    );
    if (!res.ok) throw new Error('Failed to fetch font');
    _cachedFontBuffer = await res.arrayBuffer();
    return _cachedFontBuffer;
  } catch {
    try {
      // Fallback: Google Fonts static CDN
      const res2 = await fetch(
        'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
      );
      if (!res2.ok) return undefined;
      _cachedFontBuffer = await res2.arrayBuffer();
      return _cachedFontBuffer;
    } catch {
      return undefined;
    }
  }
}

export async function generateDynamicStripResponse({
  businessName,
  currentVisits,
  requiredVisits,
  bgColor,
  fgColor,
  labelColor,
  prizeEmoji = '🏆',
  milestones,
}: DynamicStripParams): Promise<ImageResponse> {
  const fontData = await getFontBuffer();

  const maxVisits = Math.max(requiredVisits, currentVisits, 1);

  const nodes = Array.from({ length: maxVisits }, (_, i) => {
    const visitIndex = i + 1;
    const isAchieved = visitIndex <= currentVisits;
    const milestone = milestones.find((m) => m.visitTarget === visitIndex);
    return {
      visitIndex,
      isAchieved,
      milestone,
    };
  });

  const fontsConfig = fontData
    ? [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal' as const,
          weight: 700 as const,
        },
      ]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          fontFamily: fontsConfig ? 'Inter' : 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: '30px',
            marginTop: '20px',
          }}
        >
          {nodes.map((node) => {
            const hasMilestone = !!node.milestone;
            const isFinalNode = node.visitIndex === maxVisits;

            return (
              <div
                key={node.visitIndex}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: node.isAchieved ? labelColor : fgColor,
                    boxShadow:
                      node.isAchieved && hasMilestone
                        ? `0 0 20px ${labelColor}`
                        : '0 4px 6px rgba(0,0,0,0.3)',
                    border: `6px solid ${bgColor}`,
                    overflow: 'hidden',
                  }}
                >
                  {hasMilestone ? (
                    <span style={{ fontSize: '60px', transform: 'translateY(2px)' }}>
                      {node.milestone?.emoji || '🎁'}
                    </span>
                  ) : isFinalNode ? (
                    <span style={{ fontSize: '50px', transform: 'translateY(2px)' }}>
                      {prizeEmoji}
                    </span>
                  ) : (
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        opacity: node.isAchieved ? 0 : 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '30px',
                        fontWeight: 'bold',
                        color: fgColor,
                      }}
                    >
                      {!node.isAchieved ? node.visitIndex : '✔'}
                    </div>
                  )}
                </div>
                {/* Text underneath milestone/final nodes */}
                {(hasMilestone || isFinalNode) && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-35px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: node.isAchieved ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        width: '140px',
                        lineHeight: 1.2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      {hasMilestone ? node.milestone?.reward : 'Premio Final'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '24px',
            marginTop: 'auto',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {businessName} · Progreso: {currentVisits}/{requiredVisits} Visitas
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
