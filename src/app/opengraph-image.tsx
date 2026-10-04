import { ImageResponse } from "next/og";

export const alt = "WAPPX — WhatsApp Business Automation & CRM Engine";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A504A",
          padding: "60px 80px",
          justifyContent: "space-between",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow ambient background accents */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0, 168, 107, 0.4) 0%, rgba(10, 80, 74, 0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(162, 228, 184, 0.25) 0%, rgba(10, 80, 74, 0) 70%)",
          }}
        />

        {/* Top Badges Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(162, 228, 184, 0.35)",
              borderRadius: "9999px",
              padding: "10px 24px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#00A86B",
                marginRight: "12px",
              }}
            />
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#A2E4B8",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Meta Cloud API v22.0
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.65)",
            }}
          >
            <span>Starting at Rs. 1,500 LKR</span>
          </div>
        </div>

        {/* Brand and Description Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "20px",
            }}
          >
            <span
              style={{
                fontSize: "100px",
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "10px",
                lineHeight: 1,
              }}
            >
              WAPP<span style={{ color: "#00A86B" }}>X</span>
            </span>
          </div>

          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#F7F7F2",
              letterSpacing: "-0.5px",
              lineHeight: 1.25,
            }}
          >
            WhatsApp Business Automation &amp; CRM Engine
          </div>

          <div
            style={{
              fontSize: "21px",
              color: "rgba(247, 247, 242, 0.8)",
              maxWidth: "920px",
              lineHeight: 1.5,
            }}
          >
            Visual flow builder, unified live chat inbox, catalog commerce routing, and real-time webhook intelligence for enterprises.
          </div>
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          {["Visual Flow Builder", "Multi-Agent Inbox", "Order Routing", "Sri Lanka LKR Ready"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  backgroundColor: "rgba(0, 168, 107, 0.2)",
                  border: "1px solid rgba(0, 168, 107, 0.5)",
                  borderRadius: "14px",
                  padding: "12px 22px",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#A2E4B8",
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>

        {/* Bottom Metadata Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: "22px",
            fontSize: "17px",
            color: "rgba(255, 255, 255, 0.55)",
          }}
        >
          <div>Engineered by ZYNEX Developments</div>
          <div>wappx.zynexdev.com</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
