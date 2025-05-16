import { ImageResponse } from "next/og";

// 路由段配置
export const runtime = "edge";

// 图像元数据
export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 32, height: 32 },
      id: 'small',
    },
    {
      contentType: 'image/png',
      size: { width: 180, height: 180 },
      id: 'apple-touch-icon',
    },
  ];
}

// 图像生成
export default function Icon({ id }: { id: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: id === 'small' ? 24 : 72,
          background: '#032c5c',
          color: '#fff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '10%',
          fontWeight: 900,
        }}
      >
        AG
      </div>
    ),
    {
      width: id === 'small' ? 32 : 180,
      height: id === 'small' ? 32 : 180,
    },
  );
} 