import Link from "next/link";

import { auth } from "@/auth";
import { appName } from "@/lib/brand";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Logo } from "@/components/Logo";

const features = [
  {
    title: "Docker + PostgreSQL",
    description: "Infraestructura reproducible: un comando y todo levanta.",
  },
  {
    title: "Autenticación completa",
    description: "Email y contraseña, Google OAuth y sesiones JWT seguras.",
  },
  {
    title: "Gestión de usuarios",
    description: "Panel de administración con roles y control total.",
  },
  {
    title: "White label",
    description: "Diseño neutro en blanco y negro, listo para tu marca.",
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="relative flex min-h-dvh flex-col">
      <AnimatedBackground />

      <header className="flex animate-fade-in items-center justify-between px-6 py-5 md:px-10">
        <Logo />
        <nav className="flex items-center gap-3">
          {session?.user ? (
            <Link href="/welcome" className="btn-solid">
              Mi panel →
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-solid">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="badge animate-fade-up">● Plataforma white-label</span>

        <h1 className="mt-8 max-w-3xl animate-fade-up text-5xl font-semibold leading-[1.05] tracking-tight [animation-delay:.1s] md:text-7xl">
          Tu marca. Tu portal.
          <br />
          <span className="text-shimmer">Tu control.</span>
        </h1>

        <p className="mt-6 max-w-xl animate-fade-up text-lg text-neutral-400 [animation-delay:.2s]">
          Base premium de autenticación y gestión de usuarios. Docker, SQL y un
          diseño minimalista para arrancar tu próximo proyecto en minutos.
        </p>

        <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-4 [animation-delay:.3s]">
          {session?.user ? (
            <Link href="/welcome" className="btn-solid px-8 py-3 text-base">
              Ir a mi panel →
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-solid px-8 py-3 text-base">
                Empezar ahora →
              </Link>
              <Link href="/login" className="btn-ghost px-8 py-3 text-base">
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="card group animate-fade-up p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <span className="mb-3 block h-1.5 w-6 rounded-full bg-white/30 transition-all duration-300 group-hover:w-10 group-hover:bg-white" />
              <h2 className="text-sm font-semibold text-white">{feature.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="animate-fade-in px-6 py-6 text-center text-sm text-neutral-500 [animation-delay:.8s]">
        © {new Date().getFullYear()} {appName} — hecho para ser tuyo.
      </footer>
    </main>
  );
}
