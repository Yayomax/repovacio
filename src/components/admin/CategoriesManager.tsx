"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createCategory,
  deleteCategory,
  renameCategory,
} from "@/app/admin/productos/actions";
import { Spinner } from "@/components/Spinner";

type CategoryRow = {
  id: string;
  name: string;
  productCount: number;
};

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo completar la acción.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-neutral-400">
        Las categorías son 100 % tuyas: crea las que tu rubro necesite, sin
        estructura fija. También podés crearlas sin salir del formulario al
        cargar un producto. Eliminar una categoría no borra sus productos.
      </p>

      {categories.length > 0 && (
        <ul className="space-y-2">
          {categories.map((category) => {
            const draft = drafts[category.id] ?? category.name;
            const changed = draft.trim() !== category.name;
            return (
              <li key={category.id} className="card flex items-center gap-3 p-3.5">
                <input
                  value={draft}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [category.id]: event.target.value,
                    }))
                  }
                  className="field py-2 text-sm"
                />
                <span className="shrink-0 text-xs text-neutral-500">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "producto" : "productos"}
                </span>
                {changed && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => renameCategory(category.id, draft),
                        "Categoría renombrada."
                      )
                    }
                    className="btn-solid shrink-0 px-3.5 py-1.5 text-xs"
                  >
                    Guardar
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar la categoría "${category.name}"? Sus productos no se borran.`
                      )
                    ) {
                      run(() => deleteCategory(category.id), "Categoría eliminada.");
                    }
                  }}
                  className="btn-danger-ghost shrink-0 px-3.5 py-1.5 text-xs"
                >
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const name = newName.trim();
          if (name.length < 2) return;
          run(async () => {
            const result = await createCategory(name);
            return result.ok ? { ok: true } : result;
          }, `Categoría "${name}" creada.`);
          setNewName("");
        }}
      >
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nueva categoría (ej: Remeras, Hogar, Ofertas...)"
          className="field py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending || newName.trim().length < 2}
          className="btn-solid shrink-0"
        >
          {pending ? <Spinner /> : "+ Crear"}
        </button>
      </form>
    </div>
  );
}
