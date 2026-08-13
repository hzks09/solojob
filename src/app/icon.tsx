import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>SJ</span>
          <span style={{ width: 15, height: 2, background: "#e85d25", borderRadius: 1, marginTop: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
