"use client";

import { deleteUser, toggleUserRole } from "@/app/admin/usuarios/actions";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  provider: string;
  createdAt: string;
  isSelf: boolean;
};

export function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <>
      {/* Tarjetas en mobile */}
      <ul className="divide-y divide-white/5 md:hidden">
        {users.map((user) => {
          const displayName = user.name ?? user.email.split("@")[0];
          return (
            <li key={user.id} className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-sm font-semibold">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {displayName}
                    {user.isSelf && (
                      <span className="ml-2 text-xs text-neutral-500">(tú)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-neutral-400">{user.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user.role === "ADMIN"
                      ? "bg-white text-black"
                      : "border border-white/20 text-neutral-300"
                  }`}
                >
                  {user.role === "ADMIN" ? "Admin" : "Usuario"}
                </span>
              </div>
              {!user.isSelf && (
                <div className="flex gap-2">
                  <form action={toggleUserRole} className="flex-1">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="press w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors duration-150 hover:border-white/40 hover:text-white"
                    >
                      {user.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                    </button>
                  </form>
                  <form
                    action={deleteUser}
                    className="flex-1"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          `¿Eliminar la cuenta de ${user.email}? Esta acción no se puede deshacer.`
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="press w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors duration-150 hover:border-red-400/60 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tabla en escritorio */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-neutral-500">
            <th className="px-5 py-4 font-medium">Usuario</th>
            <th className="px-5 py-4 font-medium">Rol</th>
            <th className="px-5 py-4 font-medium">Acceso</th>
            <th className="px-5 py-4 font-medium">Registro</th>
            <th className="px-5 py-4 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const displayName = user.name ?? user.email.split("@")[0];
            const createdAt = new Intl.DateTimeFormat("es", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(user.createdAt));

            return (
              <tr
                key={user.id}
                className="border-b border-white/5 transition-colors duration-200 last:border-0 hover:bg-white/[0.04]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-sm font-semibold">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {displayName}
                        {user.isSelf && (
                          <span className="ml-2 text-xs text-neutral-500">
                            (tú)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-neutral-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-white text-black"
                        : "border border-white/20 text-neutral-300"
                    }`}
                  >
                    {user.role === "ADMIN" ? "Admin" : "Usuario"}
                  </span>
                </td>
                <td className="px-5 py-4 text-neutral-400">{user.provider}</td>
                <td className="px-5 py-4 text-neutral-400">{createdAt}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {!user.isSelf && (
                      <>
                        <form action={toggleUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-all duration-200 hover:border-white/40 hover:text-white"
                          >
                            {user.role === "ADMIN"
                              ? "Quitar admin"
                              : "Hacer admin"}
                          </button>
                        </form>
                        <form
                          action={deleteUser}
                          onSubmit={(event) => {
                            if (
                              !window.confirm(
                                `¿Eliminar la cuenta de ${user.email}? Esta acción no se puede deshacer.`
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-all duration-200 hover:border-red-400/60 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
