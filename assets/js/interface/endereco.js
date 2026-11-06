import {
  CAMPOS, CAMPOS_FIXOS, CAMPOS_POR_FONTE, camposDePolos, campo,
} from './formulario.js';

export function aplicarEndereco() {
  const parametros = new URLSearchParams(window.location.search);
  let aplicou = false;

  for (const nome of Object.keys(CAMPOS)) {
    if (parametros.has(nome)) {
      campo(nome).value = parametros.get(nome);
      aplicou = true;
    }
  }
  return aplicou;
}

export function atualizarEndereco() {
  const parametros = new URLSearchParams();
  const nomes = [
    ...CAMPOS_FIXOS,
    ...(CAMPOS_POR_FONTE[campo('fonte').value] || []),
    ...camposDePolos(campo('objetivo').value),
  ];

  for (const nome of nomes) {
    parametros.set(nome, campo(nome).value.trim());
  }

  window.history.replaceState(null, '', `${window.location.pathname}?${parametros}`);
}
