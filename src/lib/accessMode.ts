// Admin pode usar o site como aluno: o modo escolhido no login fica salvo nesta aba.
const KEY = 'topline_modo';
export type AccessMode = 'admin' | 'aluno';

export function getAccessMode(): AccessMode {
  try {
    return sessionStorage.getItem(KEY) === 'aluno' ? 'aluno' : 'admin';
  } catch {
    return 'admin';
  }
}

export function setAccessMode(mode: AccessMode) {
  try {
    sessionStorage.setItem(KEY, mode);
  } catch {
    /* sem armazenamento: fica no padrão */
  }
}

/** Converte o que foi digitado (e-mail, usuário ou telefone) nos e-mails de admin possíveis */
export function adminEmailCandidates(input: string): string[] {
  const loginInput = input.trim().toLowerCase();
  if (!loginInput) return [];
  if (loginInput.includes('@')) return [loginInput];
  if (loginInput === 'gabriel' || loginInput === 'admin') {
    return ['gabriel@admin.topline.com', 'gabriel0709@admin.topline.com', 'gabriel.master@admin.topline.com'];
  }
  const digits = loginInput.replace(/\D/g, '');
  if (digits) {
    const withCountry = (digits.length === 10 || digits.length === 11) && !digits.startsWith('55') ? '55' + digits : digits;
    const withoutCountry = withCountry.startsWith('55') ? withCountry.substring(2) : withCountry;
    return [`${withCountry}@admin.topline.com`, `${withoutCountry}@admin.topline.com`];
  }
  return [`${loginInput}@admin.topline.com`];
}
