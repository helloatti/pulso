# Pulso

Vista en tiempo real del estado de la búsqueda: zonas críticas, velocidad de resolución y personas sin encontrar.

Contribución al proyecto [Localizalo](https://github.com/jorgerojas26/localizalo) — plataforma humanitaria de consolidación de personas desaparecidas tras el terremoto de Venezuela 2026.

## Qué hace

- Total de personas registradas en el sistema
- % encontradas vs sin encontrar
- Tabla de zonas ordenadas por déficit (personas sin resolver)
- Velocidad de resolución promedio en días

## Stack

- Next.js 16 + React 19
- Supabase (Postgres, schema `localize`)
- Tailwind CSS v4
- TypeScript

## Cómo correrlo localmente

1. Cloná el repo:
```bash
git clone https://github.com/helloatti/pulso.git
cd pulso
```

2. Instalá dependencias:
```bash
pnpm install
```

3. Creá el archivo `.env.local` con las credenciales de Supabase:

NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key

4. Corré el servidor:
```bash
pnpm dev
```

5. Abrí `http://localhost:3000/dashboard`

## Autor

[@helloatti](https://github.com/helloatti)

