import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../componentes/Layout';
import Icone from '../componentes/Icone';
import { JOGOS } from '../dados/jogos';
import {
  AVATARES,
  atualizarPerfil,
  garantirPerfil,
  lerProgresso,
  quandoFoi,
} from '../dados/perfil';

/**
 * Meu espaco: quem esta jogando e o que ja fez.
 *
 * Nao ha cadastro nem login — ver src/dados/perfil.js para o porque. O perfil
 * e criado sozinho na primeira visita, com um bicho sorteado, e a crianca so
 * troca o bicho e o nome se quiser. Tudo vive no navegador daquele computador.
 */
function MeuEspaco() {
  // O localStorage só existe no navegador, e esta página também é renderizada
  // fora dele nos testes. Por isso começa vazio e é preenchido depois.
  const [perfil, setPerfil] = useState(null);
  const [editando, setEditando] = useState(false);
  const [apelido, setApelido] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    setPerfil(garantirPerfil());
  }, []);

  const abrirEdicao = () => {
    setApelido(perfil.apelido);
    setAvatar(perfil.avatar);
    setEditando(true);
  };

  /**
   * Escolher o bicho sugere o nome dele — a criança só precisa apontar. Mas se
   * ela já escreveu algo seu, trocar de bicho não apaga: só substitui enquanto
   * o campo ainda for a sugestão anterior.
   */
  const aoEscolherBicho = (bicho) => {
    const ehSugestao = AVATARES.some((a) => a.nome === apelido);
    setAvatar(bicho.emoji);
    if (!apelido.trim() || ehSugestao) setApelido(bicho.nome);
  };

  // Só o que foi aberto, do mais recente para o mais antigo: a criança quer
  // ver primeiro onde parou.
  const jogados = perfil
    ? JOGOS.map((jogo) => ({ jogo, p: lerProgresso(jogo, perfil.id) }))
        .filter(({ p }) => p.aberturas > 0)
        .sort((a, b) => String(b.p.ultimaVez).localeCompare(String(a.p.ultimaVez)))
    : [];

  const aoSalvar = (e) => {
    e.preventDefault();
    setPerfil(atualizarPerfil(perfil.id, { apelido, avatar }));
    setEditando(false);
  };

  return (
    <Layout>
      <section className="bq-turma-abertura">
        <div className="bq-largura">
          <h1>Meu espaço</h1>
        </div>
      </section>

      <div className="bq-largura bq-espaco">
        {perfil && (
          <>
            {/* --- O perfil --- */}
            <section className="bq-bloco">
              {editando ? (
                <form className="bq-novo-perfil" onSubmit={aoSalvar}>
                  <fieldset>
                    <legend>Escolha o seu bicho</legend>
                    <div className="bq-avatares">
                      {AVATARES.map((a) => (
                        <label
                          key={a.emoji}
                          className={avatar === a.emoji ? 'escolhido' : ''}
                        >
                          <input
                            type="radio"
                            name="avatar"
                            value={a.emoji}
                            checked={avatar === a.emoji}
                            onChange={() => aoEscolherBicho(a)}
                          />
                          <span aria-hidden="true">{a.emoji}</span>
                          <span className="bq-so-leitor">{a.nome}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="bq-campo">
                    <span>Como quer ser chamado?</span>
                    <input
                      type="text"
                      value={apelido}
                      onChange={(e) => setApelido(e.target.value)}
                      maxLength={18}
                      autoComplete="off"
                    />
                    <small>
                      Pode deixar o nome do bicho ou inventar outro. Não escreva
                      o seu nome completo.
                    </small>
                  </label>

                  <div className="bq-novo-perfil-botoes">
                    <button type="submit" className="bq-botao bq-botao-principal">
                      Pronto
                    </button>
                    <button
                      type="button"
                      className="bq-botao bq-botao-claro"
                      onClick={() => setEditando(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bq-cartao-perfil">
                  <span className="bq-cartao-perfil-avatar" aria-hidden="true">
                    {perfil.avatar}
                  </span>
                  <span className="bq-cartao-perfil-nome">{perfil.apelido}</span>
                  <button
                    type="button"
                    className="bq-botao bq-botao-claro"
                    onClick={abrirEdicao}
                  >
                    Trocar bicho ou nome
                  </button>
                </div>
              )}
            </section>

            {/* --- Progresso ---
                Só os jogos que a criança abriu: uma grade com os dez, quase
                toda marcada como "ainda não jogou", enterra o que ela de fato
                fez. A lista completa já existe em /jogos. */}
            <section className="bq-bloco">
              <h2>O que {perfil.apelido} já jogou</h2>

              {jogados.length === 0 ? (
                <div className="bq-espaco-vazio">
                  <p>
                    Ainda não tem nada por aqui. Escolha um jogo para começar —
                    o que você fizer fica guardado nesta página.
                  </p>
                  <Link className="bq-botao bq-botao-principal" to="/jogos">
                    Ver os jogos
                    <Icone nome="seta" tamanho={18} />
                  </Link>
                </div>
              ) : (
              <div className="bq-fichas">
                {jogados.map(({ jogo, p }) => {
                  return (
                    <article className="bq-ficha-jogo" key={jogo.slug}>
                      <img src={jogo.capa} alt="" width="1200" height="675" />

                      <div className="bq-ficha-jogo-corpo">
                        <h3>
                          <Link to={`/jogo/${jogo.slug}`}>{jogo.titulo}</Link>
                        </h3>

                        <p className="bq-ficha-jogo-uso">
                          Jogou {p.aberturas}{' '}
                          {p.aberturas === 1 ? 'vez' : 'vezes'} ·{' '}
                          {quandoFoi(p.ultimaVez)}
                        </p>

                        {p.detalhes?.length > 0 && (
                          <dl className="bq-ficha-jogo-dados">
                            {p.detalhes.map((d) => (
                              <div key={d.rotulo}>
                                <dt>{d.rotulo}</dt>
                                <dd>{d.valor}</dd>
                              </div>
                            ))}
                          </dl>
                        )}

                        {!p.registraProgresso && (
                          <p className="bq-ficha-jogo-nota">
                            Este jogo ainda não guarda pontuação
                          </p>
                        )}

                        <Link
                          className="bq-ficha-jogo-jogar"
                          to={`/jogar/${jogo.slug}`}
                        >
                          <Icone nome="play" tamanho={14} />
                          Jogar de novo
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
              )}
            </section>
          </>
        )}

        <p className="bq-aviso-privacidade">
          <strong>Sobre os seus dados:</strong> tudo que aparece nesta página
          fica guardado só neste computador, dentro do navegador. Nada é enviado
          para a internet e ninguém do projeto tem acesso. Se usar outro
          computador, o progresso não vai junto — e se alguém limpar os dados do
          navegador, ele é apagado.
        </p>
      </div>
    </Layout>
  );
}

export default MeuEspaco;
