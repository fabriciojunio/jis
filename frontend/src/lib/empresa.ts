/**
 * Onde achar a empresa fora do quadro de vagas.
 *
 * O anúncio agregado dá o link da vaga, e não o da empresa. Só que boa parte
 * das candidaturas que dão certo não sai do quadro: sai do site da empresa ou
 * de um e-mail direto. Este módulo resolve os dois casos, sem chamar API
 * nenhuma e sem chave.
 */

/** Domínios que hospedam vaga de terceiro, e portanto não são o site da empresa. */
const QUADROS_DE_VAGA = [
  "gupy.io",
  "greenhouse.io",
  "lever.co",
  "workable.com",
  "recruitee.com",
  "inhire.app",
  "inhire.com.br",
  "jobii.com.br",
  "solides.com",
  "vagas.com.br",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "remotive.com",
  "remoteok.com",
  "jobicy.com",
  "himalayas.app",
  "arbeitnow.com",
  "themuse.com",
  "weworkremotely.com",
  "getonbrd.com",
  "workatastartup.com",
  "ashbyhq.com",
  "breezy.hr",
  "bamboohr.com",
  "smartrecruiters.com",
  "jobvite.com",
  "taleo.net",
  "myworkdayjobs.com",
];

/**
 * O site da empresa, quando o link da vaga entrega isso de graça.
 *
 * Dois casos rendem: o quadro que usa subdomínio com o nome da empresa
 * (`empresa.gupy.io` vira `empresa.com.br` como palpite? não: palpite de
 * domínio erra demais e link quebrado é pior que link nenhum), e a vaga
 * publicada no próprio site da empresa, que é o caso que dá certo.
 *
 * Por isso a regra é conservadora: só devolve endereço quando o link da vaga
 * já está no domínio da própria empresa. Nos outros casos devolve `null`, e
 * quem chama cai na busca.
 */
export function siteDaEmpresa(linkDaVaga: string): string | null {
  try {
    const url = new URL(linkDaVaga);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (QUADROS_DE_VAGA.some((quadro) => host === quadro || host.endsWith("." + quadro))) {
      return null;
    }
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

/**
 * Busca pronta pelo site e pela página de carreiras da empresa.
 *
 * É o caminho de sempre funcionar: nome da empresa mais "carreiras" resolve
 * em um clique, inclusive quando o site tem domínio que ninguém adivinharia.
 */
export function buscarEmpresa(nomeDaEmpresa: string): string {
  const termo = encodeURIComponent(`${nomeDaEmpresa} carreiras trabalhe conosco`);
  return `https://duckduckgo.com/?q=${termo}`;
}

/** Busca pelo perfil da empresa no LinkedIn, para achar quem recruta lá. */
export function buscarNoLinkedin(nomeDaEmpresa: string): string {
  const termo = encodeURIComponent(nomeDaEmpresa);
  return `https://www.linkedin.com/search/results/companies/?keywords=${termo}`;
}
