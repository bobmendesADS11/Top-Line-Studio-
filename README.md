# Top Line Studio — Plataforma de Álbuns 3D

Aplicação da **Top Line Formaturas** para formandos criarem e visualizarem o álbum de formatura em 3D.

Produção: https://top-line-studio-nine.vercel.app

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **3D:** Three.js + React Three Fiber + Drei
- **Animações:** Motion
- **Backend:** Firebase (Authentication + Cloud Firestore)
- **Hospedagem:** Vercel (deploy automático a cada push na `main`)

## Estrutura

| Rota | Tela |
| --- | --- |
| `/` | Página inicial (Landing) |
| `/login` | Login de aluno e de administrador |
| `/area-do-aluno` | Painel do aluno, galeria, editor de álbum e visualizador 3D |
| `/admin` | Painel administrativo (alunos, pedidos, fotos) |

Firestore (banco `ai-studio-99dc72af-...`):

- `users/{uid}` — perfil (`role`: `admin` / `student` / `pending`, `package`)
- `users/{uid}/photos` — fotos do aluno (data URL comprimida)
- `users/{uid}/drafts/album_editor` — rascunho do editor
- `orders` — pedidos
- `albums` — catálogo público

## Segurança

- Quem é admin é decidido **só** pelas regras em `firestore.rules` (campo `role = 'admin'`,
  ou as contas mestre verificadas). Nunca colocar senhas ou listas de admin no código do site.
- Contas de admin novas: crie o usuário no Firebase Authentication e defina `role: "admin"`
  no documento `users/{uid}` pelo console.
- Depois de alterar `firestore.rules`, publique no console do Firebase
  (Firestore → banco `ai-studio-...` → Regras).

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint    # checagem de tipos
npm run build   # build de produção em dist/
```
