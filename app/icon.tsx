import { ImageResponse } from "next/og";

// 路由段配置
export const runtime = "edge";

// 图像元数据
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// 图像生成
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
          backgroundColor: "#fff",
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        A
      </div>
    ),
    {
      ...size,
    }
  );
} 