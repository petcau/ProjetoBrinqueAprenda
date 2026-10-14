import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../componentes/Layout';
import Icone from '../componentes/Icone';
import { JOGOS } from '../dados/jogos';
import {
  AVATARES,
  apagarPerfil,
  criarPerfil,
  lerPerfilAtivo,
  lerPerfis,
  lerProgresso,
  quandoFoi,
  trocarPerfil,
} from '../dados/perfil';

/**
 * Meu espaco: quem esta jogando e o que ja fez.
 *
 * Nao ha conta nem senha — ver src/dados/perfil.js para o porque. O perfil
 * vive no navegador daquele computador, e so.
 */
function MeuEspaco() {
  // O localStorage só existe no navegador, e esta página também é renderizada
  // fora dele nos testes. Por isso o estado começa vazio e é preenchido depois.
  const [perfis, setPerfis] = useState([]);
  const [ativo, setAtivo] = useState(null);
  const [criando, setCriando] = useState(false);
  const [apelido, setApelido] = useState('');
  const [avatar, setAvatar] = useState(AVATARES[0]);

  const recarregar = () => {
    setPerfis(lerPerfis());
    setAtivo(lerPerfilAtivo());
  };

  useEffect(recarregar, []);

  const aoCriar = (e) => {
    e.preventDefault();
    if (!apelido.trim()) return;
    criarPerfil(apelido, avatar);
    setApelido('');
    setCriando(false);
    recarregar();
  };

  const aoTrocar = (id) => {
    trocarPerfil(id);
    recarregar();
  };

  const aoApagar = (perfil) => {
    const certeza = window.confirm(
      `Apagar o perfil de ${perfil.apelido}? O progresso dele será perdido.`,
    );
    if (!certeza) return;
    apagarPerfil(perfil.id);
    recarregar();
  };

  return (
    <Layout>
      <section className="bq-turma-abertura">
        <div className="bq-largura">
          <h1>Meu espaço</h1>
          <p>
            Escolha quem está jogando para guardar o seu progresso neste
            computador. Não pedimos nome de verdade, e-mail nem senha — o
            apelido fica só aqui e ninguém mais vê.
          </p>
        </div>
      </section>

      <div className="bq-largura bq-espaco">
        {/* --- Quem está jogando --- */}
        <section className="bq-bloco">
          <h2>Quem está jogando</h2>

          <div className="bq-perfis">
            {perfis.map((p) => (
              <div
                key={p.id}
                className={`bq-perfil ${ativo?.id === p.id ? 'ativo' : ''}`}
              >
                <button type="button" onClick={() => aoTrocar(p.id)}>
                  <span className="bq-perfil-avatar" aria-hidden="true">
                    {p.avatar}
                  </span>
                  <span className="bq-perfil-nome">{p.apelido}</span>
                  {ativo?.id === p.id && <small>jogando agora</small>}
                </button>

                <button
                  type="button"
                  className="bq-perfil-apagar"
                  onClick={() => aoApagar(p)}
                  aria-label={`Apagar o perfil de ${p.apelido}`}
                >
                  <Icone nome="fechar" tamanho={14} />
                </button>
              </div>
            ))}

            {!criando && (
              <button
                type="button"
                className="bq-perfil-novo"
                onClick={() => setCriando(true)}
              >
                <span aria-hidden="true">＋</span>
                Criar perfil
              </button>
            )}
          </div>

          {criando && (
            <form className="bq-novo-perfil" onSubmit={aoCriar}>
              <fieldset>
                <legend>Escolha o seu bicho</legend>
                <div className="bq-avatares">
                  {AVATARES.map((a) => (
                    <label key={a} className={avatar === a ? 'escolhido' : ''}>
                      <input
                        type="radio"
                        name="avatar"
                        value={a}
                        checked={avatar === a}
                        onChange={() => setAvatar(a)}
                      />
                      <span aria-hidden="true">{a}</span>
                      <span className="bq-so-leitor">Bicho {a}</span>
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
                  placeholder="Um apelido divertido"
                  autoComplete="off"
                />
                <small>
                  Pode ser qualquer coisa. Não escreva o seu nome completo.
                </small>
              </label>

              <div className="bq-novo-perfil-botoes">
                <button type="submit" className="bq-botao bq-botao-principal">
                  Pronto
                </button>
                <button
                  type="button"
                  className="bq-botao bq-botao-claro"
                  onClick={() => setCriando(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>

        {/* --- Progresso --- */}
        {ativo ? (
          <section className="bq-bloco">
            <h2>O que {ativo.apelido} já jogou</h2>

            <div className="bq-fichas">
              {JOGOS.map((jogo) => {
                const p = lerProgresso(jogo, ativo.id);
                return (
                  <article className="bq-ficha-jogo" key={jogo.slug}>
                    <img src={jogo.capa} alt="" width="1200" height="675" />

                    <div className="bq-ficha-jogo-corpo">
                      <h3>
                        <Link to={`/jogo/${jogo.slug}`}>{jogo.titulo}</Link>
                      </h3>

                      {p.aberturas === 0 ? (
                        <p className="bq-ficha-jogo-vazio">Ainda não jogou</p>
                      ) : (
                        <>
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
                        </>
                      )}

                      <Link className="bq-ficha-jogo-jogar" to={`/jogar/${jogo.slug}`}>
                        <Icone nome="play" tamanho={14} />
                        {p.aberturas === 0 ? 'Jogar' : 'Jogar de novo'}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="bq-bloco">
            <p className="bq-texto">
              Crie um perfil acima para o portal começar a guardar por onde você
              parou em cada jogo.
            </p>
          </section>
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
