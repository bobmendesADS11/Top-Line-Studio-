# Top Line Studio - Plataforma de Álbuns 3D

Este projeto é uma aplicação moderna para a **Top Line Formaturas**, permitindo que formandos criem e visualizem seus álbuns de formatura em um ambiente 3D interativo.

## 🧱 Stack Tecnológica

- **Frontend:** React + Vite
- **Estilo:** Tailwind CSS 4
- **3D:** Three.js + React Three Fiber + Drei
- **Animações:** Motion (Framer Motion)
- **Backend:** Supabase (Integração preparada)

## 🗄️ Modelagem do Banco (Supabase)

Para colocar em produção no Supabase, execute o seguinte SQL no Editor de SQL do seu projeto:

```sql
-- 1. Users (Extensão do Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  phone text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Albums
create table public.albums (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  status text check (status in ('editing', 'finished', 'approved')) default 'editing',
  total_pages integer default 20,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Photos
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  url text not null,
  thumbnail_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Favorites
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  photo_id uuid references public.photos not null
);

-- 5. Album Pages
create table public.album_pages (
  id uuid default gen_random_uuid() primary key,
  album_id uuid references public.albums not null,
  page_number integer not null
);

-- 6. Album Items
create table public.album_items (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.album_pages not null,
  photo_id uuid references public.photos not null,
  position_x float not null,
  position_y float not null,
  width float not null,
  height float not null,
  rotation float default 0
);
```

## 🚀 Como Rodar

1. Instale as dependências: `npm install`
2. Configure o `.env` com suas chaves do Supabase (veja `.env.example`)
3. Inicie o servidor de desenvolvimento: `npm run dev`

## ✨ Funcionalidades Implementadas

- [x] Landing Page sofisticada com tema "Gold & Navy"
- [x] Fluxo de Autenticação via Telefone (Mock)
- [x] Galeria de fotos com Lazy Loading (200+ fotos)
- [x] Seleção de fotos para o álbum
- [x] Visualizador de Álbum 3D interativo
- [x] Editor com navegação entre páginas
- [x] Geração de JSON para exportação futura
