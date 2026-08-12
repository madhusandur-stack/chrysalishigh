import logoAsset from "@/assets/chrysalis-logo.png.asset.json";

export function ChrysalisLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Chrysalis High"
      className={`h-12 w-auto object-contain drop-shadow-sm dark:brightness-110 ${className}`}
    />
  );
}
