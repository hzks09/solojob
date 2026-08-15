import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0c",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 26,
              background: "#1a1a1e",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "26px solid transparent",
                borderBottom: "26px solid transparent",
                borderLeft: "42px solid #dc1030",
                marginLeft: 10,
              }}
            />
          </div>
          <span style={{ fontSize: 88, fontWeight: 900, color: "#f6f5f3" }}>Loupick</span>
        </div>
        <span style={{ marginTop: 36, fontSize: 34, color: "#f6f5f3bf" }}>
          Trouve une vidéo YouTube qui va te plaire
        </span>
      </div>
    ),
    { ...size }
  );
}
