import Image from "next/image";

type Props = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

export function Logo({ size = 32, withWordmark = true, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/icon.png"
        alt="Toomny"
        width={size}
        height={size}
        className="shrink-0"
        style={{ width: size, height: size, objectFit: "contain" }}
        priority
      />
      {withWordmark && (
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: size * 0.72, lineHeight: 1 }}
        >
          Toomny
        </span>
      )}
    </span>
  );
}
