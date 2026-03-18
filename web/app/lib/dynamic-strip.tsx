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

  const fontsConfig = fontData
    ? [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }]
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
        {/* Stamp grid */}
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
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    backgroundColor: node.isAchieved ? labelColor : fgColor,
                    boxShadow:
                      node.isAchieved && hasMilestone
                        ? `0 0 20px ${labelColor}`
                        : '0 4px 6px rgba(0,0,0,0.3)',
                    border: `6px solid ${bgColor}`,
                  }}
                >
                  {hasMilestone ? (
                    <span style={{ fontSize: '52px', display: 'flex' }}>
                      {node.milestone?.emoji ?? '\u{1F381}'}
                    </span>
                  ) : isFinalNode ? (
                    <span style={{ fontSize: '46px', display: 'flex' }}>
                      {prizeEmoji}
                    </span>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        opacity: node.isAchieved ? 0 : 0.6,
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: fgColor,
                      }}
                    >
                      {node.isAchieved ? '\u2713' : String(node.visitIndex)}
                    </div>
                  )}
                </div>

                {/* Label below milestone/final nodes */}
                {showLabel && (
                  <div
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      bottom: '-32px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '140px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        color: node.isAchieved ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        lineHeight: 1.2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
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

        {/* Bottom progress bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '22px',
            marginTop: 'auto',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
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
