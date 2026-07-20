import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CartProvider } from "@/components/store/CartProvider";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <div className="relative flex min-h-dvh flex-col">
        <AnimatedBackground />
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
