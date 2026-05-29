interface DetailProps {
  label: string;
  value: string;
  image?: string;
  imageSize?: number;
}

const Detail = ({ label, value, image, imageSize = 56 }: DetailProps) => (
  <div className="flex items-center gap-2">
    <span
      className="w-16 shrink-0 text-xs capitalize"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {label}
    </span>
    {image && (
      <img
        src={image}
        width={imageSize}
        height={imageSize}
        style={{ width: imageSize, height: imageSize }}
        className="rounded-full border-2 border-white object-cover shrink-0"
      />
    )}
    <span className="text-sm text-white capitalize font-bold">{value}</span>
  </div>
);

export default Detail;
