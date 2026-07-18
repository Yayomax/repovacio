export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#060606]"
    >
      {/* Rejilla con desvanecido radial */}
      <div className="absolute inset-0 bg-grid opacity-100 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />

      {/* Orbes flotantes en escala de grises */}
      <div className="absolute -top-40 left-[15%] h-[26rem] w-[26rem] animate-float rounded-full bg-white/10 blur-[130px]" />
      <div className="absolute right-[10%] top-1/3 h-72 w-72 animate-float-slow rounded-full bg-white/[0.06] blur-[110px]" />
      <div className="absolute -bottom-32 left-1/3 h-80 w-80 animate-float rounded-full bg-white/[0.08] blur-[120px] [animation-delay:-8s]" />

      {/* Grano */}
      <div className="noise absolute inset-0" />
    </div>
  );
}
