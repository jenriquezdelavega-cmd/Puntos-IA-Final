import { ImageResponse } from 'next/og';

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
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            position: 'relative',
            height: '120px',
            marginTop: '20px',
          }}
        >
          {/* Base connector line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '2%',
              right: '2%',
              height: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-50%)',
              borderRadius: '4px',
              zIndex: 0,
            }}
          />

          {/* Progress connector line */}
          {currentVisits > 1 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '2%',
                width: `${(Math.min(currentVisits - 1, maxVisits - 1) / (maxVisits - 1)) * 96}%`,
                height: '8px',
                backgroundColor: labelColor,
                transform: 'translateY(-50%)',
                borderRadius: '4px',
                zIndex: 1,
                boxShadow: `0 0 10px ${labelColor}`,
              }}
            />
          )}

          {/* Nodes */}
          {nodes.map((node) => {
            const size = node.milestone ? 80 : 40;
            const innerSize = node.milestone ? 60 : 20;
            const hasMilestone = !!node.milestone;

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
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    backgroundColor: node.isAchieved ? labelColor : fgColor,
                    boxShadow: node.isAchieved && hasMilestone
                      ? `0 0 20px ${labelColor}`
                      : '0 4px 6px rgba(0,0,0,0.3)',
                    border: `4px solid ${bgColor}`,
                  }}
                >
                  {hasMilestone ? (
                    <span style={{ fontSize: '38px', transform: 'translateY(2px)' }}>
                      {node.milestone?.emoji || '🎁'}
                    </span>
                  ) : (
                    <div
                      style={{
                        width: `${innerSize}px`,
                        height: `${innerSize}px`,
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        opacity: node.isAchieved ? 0 : 0.5,
                      }}
                    />
                  )}
                </div>
                {/* Text underneath the node */}
                {hasMilestone && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '90px',
                      display: 'flex',
                      color: node.isAchieved ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      width: '120px',
                      justifyContent: 'center',
                    }}
                  >
                    {node.visitIndex}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '24px',
            marginTop: 'auto',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {businessName} · Progreso: {currentVisits}/{requiredVisits} Visitas
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
