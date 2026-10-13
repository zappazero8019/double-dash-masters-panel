import { useMemo, useState } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { useI18n } from '../i18n';
import { useRecurso } from '../hooks/useRecurso';
import { obterCampeonato } from '../api/recursos';
import { CabecalhoPagina } from '../components/CabecalhoPagina';
import { CarimboAtualizacao } from '../components/CarimboAtualizacao';
import { Cartao } from '../components/Cartao';
import { Aviso } from '../components/Aviso';
import { Badge } from '../components/Badge';
import { EstadoVazio } from '../components/EstadoVazio';
import { ResultadoConsulta } from '../components/ResultadoConsulta';
import { ListaEsqueleto } from '../components/Esqueleto';
import { formatarNumero, formatarTemporada } from '../utils/formatar';
import { compararNome, unicos } from '../utils/ordenar';
import type { CampeonatoDto } from '../types/api';

const TODAS = 'todas';

export function Campeonato() {
  const { t } = useI18n();
  const consulta = useRecurso<CampeonatoDto[]>('campeonato', (sinal) =>
    obterCampeonato({ sinal, limite: 500 }),
  );

  return (
    <>
      <CabecalhoPagina
        kicker={t('app.marca.subtitulo')}
        titulo={t('campeonato.titulo')}
        subtitulo={t('campeonato.subtitulo')}
        acoes={
          <CarimboAtualizacao
            atualizadoEm={consulta.atualizadoEm}
            carregando={consulta.carregando}
          />
        }
      />

      <ResultadoConsulta
        carregando={consulta.carregando}
        erro={consulta.erro}
        recarregar={consulta.recarregar}
        vazio={consulta.dados?.length === 0}
        vazioNode={
          <EstadoVazio
            titulo={t('campeonato.vazio.titulo')}
            texto={t('campeonato.vazio.texto')}
            icone={<Trophy size={24} />}
          />
        }
        esqueleto={<ListaEsqueleto linhas={6} />}
      >
        {consulta.dados && <Classificacao linhas={consulta.dados} />}
      </ResultadoConsulta>
    </>
  );
}

function Classificacao({ linhas }: { linhas: CampeonatoDto[] }) {
  const { t, idioma } = useI18n();
  const [temporada, setTemporada] = useState<string>(TODAS);

  const temporadas = useMemo(
    () =>
      unicos(
        linhas.map((l) => l.temporada).filter((v): v is number => v !== null && v !== undefined),
      ).sort((a, b) => b - a),
    [linhas],
  );

  const filtradas = useMemo(() => {
    const base = temporada === TODAS ? linhas : linhas.filter((l) => String(l.temporada) === temporada);
    // Soma vitórias por jogador (quando "todas as temporadas", agrega; caso
    // contrário, é 1 linha por jogador).
    const mapa = new Map<string, { nome: string; vitorias: number }>();
    for (const linha of base) {
      const chave = String(linha.player_id);
      const atual = mapa.get(chave) ?? { nome: linha.nome?.trim() || `#${chave}`, vitorias: 0 };
      atual.vitorias += linha.vitorias ?? 0;
      if (linha.nome?.trim()) atual.nome = linha.nome.trim();
      mapa.set(chave, atual);
    }
    return [...mapa.values()].sort(
      (a, b) => b.vitorias - a.vitorias || compararNome(a.nome, b.nome, idioma),
    );
  }, [linhas, temporada, idioma]);

  return (
    <div className="pilha">
      <div className="barra-filtros">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="temporada">
            {t('campeonato.seletor.rotulo')}
          </label>
          <select
            id="temporada"
            className="select"
            value={temporada}
            onChange={(evento) => setTemporada(evento.target.value)}
          >
            <option value={TODAS}>{t('campeonato.seletor.todas')}</option>
            {temporadas.map((ano) => (
              <option key={ano} value={String(ano)}>
                {formatarTemporada(ano)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Aviso tom="regra" titulo={t('campeonato.regra.titulo')}>
        {t('campeonato.regra.texto')}
      </Aviso>

      <Cartao>
        {filtradas.length === 0 ? (
          <EstadoVazio titulo={t('campeonato.vazio.titulo')} texto={t('campeonato.vazio.texto')} />
        ) : (
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th scope="col">{t('campeonato.col.posicao')}</th>
                  <th scope="col">{t('campeonato.col.jogador')}</th>
                  <th scope="col" className="num">
                    {t('campeonato.col.vitorias')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((linha, indice) => (
                  <tr key={linha.nome} className={indice === 0 ? 'campeonato-lider' : undefined}>
                    <td>
                      <span className={`posicao${indice < 3 ? ` posicao--${indice + 1}` : ''}`}>
                        {indice + 1}
                      </span>
                    </td>
                    <td>
                      <span className="linha" style={{ gap: 8 }}>
                        {linha.nome}
                        {indice === 0 && (
                          <Badge variante="neon">
                            <Crown size={12} aria-hidden="true" /> {t('campeonato.lider')}
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="num destaque">{formatarNumero(linha.vitorias, idioma)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  );
}
