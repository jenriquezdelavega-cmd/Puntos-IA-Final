import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export type DynamicStripParams = {
  businessName: string;
  currentVisits: number;
  requiredVisits: number;
  bgColor: string;
  fgColor: string;
  labelColor: string;
  milestones: Array<{ visitTarget: number; emoji: string; reward: string }>;
};

const WIDTH = 1032;
const HEIGHT = 336;

export function generateDynamicStripResponse({
  businessName,
  currentVisits,
  requiredVisits,
  bgColor,
  fgColor,
  labelColor,
  milestones,
}: DynamicStripParams): ImageResponse {
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
          fontFamily: 'sans-serif',
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
          {/* Nodes (Punch card stamps) */}
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
                    boxShadow: node.isAchieved && hasMilestone
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
                      🏆
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
                      {!node.isAchieved ? node.visitIndex : '✔️'}
                    </div>
                  )}
                </div>
                {/* Text underneath the node */}
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
      fonts: (() => {
        try {
          const fontPath = path.join(process.cwd(), 'wallet-assets', 'Inter-Bold.ttf');
          const fontData = fs.readFileSync(fontPath);
          return [
            {
              name: 'Inter',
              data: fontData.buffer.slice(fontData.byteOffset, fontData.byteOffset + fontData.byteLength),
              style: 'normal',
              weight: 800,
            },
          ];
        } catch {
          return undefined;
        }
      })() as any,
    }
  );
}
