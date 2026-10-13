import { urlRecurso } from './config';
import type { RespostaApi } from '../types/api';

/** Códigos de erro normalizados, traduzíveis na interface. */
export type CodigoErro = 'rede' | 'timeout' | 'http' | 'resposta';

export class ErroApi extends Error {
  readonly codigo: CodigoErro;
  readonly status?: number;

  constructor(codigo: CodigoErro, mensagem: string, status?: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.codigo = codigo;
    this.status = status;
  }
}

/** Converte qualquer erro desconhecido num ErroApi consistente. */
export function normalizarErro(erro: unknown): ErroApi {
  if (erro instanceof ErroApi) return erro;
  if (erro instanceof DOMException && erro.name === 'AbortError') {
    return new ErroApi('timeout', 'A requisição excedeu o tempo limite.');
  }
  return new ErroApi('rede', 'Falha de comunicação com a API.');
}

const TIMEOUT_PADRAO_MS = 15000;

interface OpcoesBusca {
  /** Sinal externo (ex.: cancelamento ao desmontar um componente). */
  signal?: AbortSignal;
  /** Tempo máximo, em milissegundos. */
  timeoutMs?: number;
}

/**
 * Executa um GET no recurso informado e devolve a lista `dados`.
 *
 * - Aplica timeout próprio (combinado com o sinal externo).
 * - Valida o envelope `{ ok, recurso, dados }` antes de entregar os dados.
 * - Lança ErroApi tipado para a UI tratar carregamento/erro/vazio.
 */
export async function buscarRecurso<T>(
  recurso: string,
  params?: Record<string, string | undefined>,
  opcoes: OpcoesBusca = {},
): Promise<T[]> {
  const { signal: sinalExterno, timeoutMs = TIMEOUT_PADRAO_MS } = opcoes;
  const controlador = new AbortController();
  let porTimeout = false;

  const temporizador = setTimeout(() => {
    porTimeout = true;
    controlador.abort();
  }, timeoutMs);

  const aoAbortar = () => controlador.abort();
  if (sinalExterno) {
    if (sinalExterno.aborted) controlador.abort();
    else sinalExterno.addEventListener('abort', aoAbortar);
  }

  try {
    const resposta = await fetch(urlRecurso(recurso, params), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      throw new ErroApi('http', `Resposta HTTP ${resposta.status}.`, resposta.status);
    }

    let corpo: unknown;
    try {
      corpo = await resposta.json();
    } catch {
      throw new ErroApi('resposta', 'Resposta não é um JSON válido.');
    }

    if (
      typeof corpo !== 'object' ||
      corpo === null ||
      (corpo as RespostaApi<T>).ok !== true ||
      !Array.isArray((corpo as RespostaApi<T>).dados)
    ) {
      throw new ErroApi('resposta', 'Envelope de resposta inesperado.');
    }

    return (corpo as RespostaApi<T>).dados;
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    if (porTimeout) {
      throw new ErroApi('timeout', 'A requisição excedeu o tempo limite.');
    }
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      // Cancelamento externo: repassa como está para o hook ignorar.
      throw erro;
    }
    throw new ErroApi('rede', 'Não foi possível contatar a API.');
  } finally {
    clearTimeout(temporizador);
    if (sinalExterno) sinalExterno.removeEventListener('abort', aoAbortar);
  }
}
