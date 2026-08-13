import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d3557",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 92, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>SJ</span>
          <span style={{ width: 78, height: 9, background: "#e85d25", borderRadius: 5, marginTop: 12 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
