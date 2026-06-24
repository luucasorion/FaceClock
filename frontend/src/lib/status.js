// Collaborator activation status helpers.
//
// The backend serializes `status` as a BOOLEAN (ColaboradorResponse.status: bool)
// where true = active. Earlier UI code compared it against the string 'ativo',
// so `String(true) === 'ativo'` was always false and every collaborator rendered
// as inactive. These helpers normalize the value once, accepting the boolean
// plus a few legacy string forms ('ativo' / 'true' / '1') for safety.

export function isAtivo(status) {
  if (typeof status === 'boolean') return status;
  if (typeof status === 'number') return status !== 0;
  const s = String(status ?? '').trim().toLowerCase();
  return s === 'ativo' || s === 'true' || s === '1';
}

export function statusLabel(status) {
  return isAtivo(status) ? 'Ativo' : 'Inativo';
}
