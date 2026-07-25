# Política de segurança

## Versões suportadas

Correções de segurança são aplicadas sempre no ramo `main`. Não há suporte a
versões antigas: use sempre a última.

## Como reportar uma vulnerabilidade

Reporte de forma responsável e privada, sem abrir issue pública:

- Abra um **Security Advisory** em *Security > Advisories* neste repositório, ou
- envie um e-mail para **fabricioad444@gmail.com** com o assunto `[SECURITY] JIS`.

Inclua passos de reprodução, impacto e, se possível, uma prova de conceito.
O retorno inicial acontece em até **72 horas**. Pedimos que a falha não seja
divulgada publicamente até haver correção disponível.

## Modelo de segurança da aplicação

O JIS é um agregador de vagas. Pontos relevantes de segurança já implementados:

### Coleta de fontes externas (anti-SSRF)
- Toda ida à rede passa por `safeFetch`, que só permite **HTTPS** para **hosts
  públicos**. Loopback (`127.0.0.1`, `localhost`, `::1`), faixas privadas
  (`10/8`, `172.16/12`, `192.168/16`), link-local (`169.254/16`) e o endpoint de
  metadados de nuvem são bloqueados antes de qualquer requisição.
- Redirects são recusados (`redirect: "error"`) para que uma fonte não consiga
  desviar o fetch para um host arbitrário.
- Timeout de 15s e teto de resposta (8 MB) contra travamento e exaustão.
- As URLs das fontes são **constantes** no código: nenhuma entrada do usuário
  compõe a URL buscada pelo servidor.

### Superfície de API
- `GET /api/jobs` é a única rota de servidor. Não recebe entrada do usuário.
- **Rate limiting** por IP protege contra abuso/amplificação (ver limitação
  serverless em `src/lib/rate-limit.ts`).
- Erros nunca vazam stack trace: o cliente recebe mensagem genérica; o detalhe
  fica só no log do servidor.

### Validação de entrada
- Importação do GitHub valida o formato do usuário e recusa tokens com
  caracteres de controle (proteção contra *header injection*).

### Cabeçalhos e proteção do cliente
- CSP restritiva (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri
  'self'`, sem `unsafe-eval` em produção), HSTS com `preload`, `X-Frame-Options:
  DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e
  `Permissions-Policy` restritivas, COOP/CORP `same-origin`.
- `X-Powered-By` removido, source maps de produção desligados, `console.*`
  removido do bundle (preservando `error`/`warn` no servidor).
- `robots.txt` bloqueia crawlers e bots de IA; o HTML reforça com `noindex`.

## Limitações conhecidas (honestas)
- O rate limiting é **best-effort em memória**: em serverless o teto vale por
  instância, não globalmente. Para um teto forte use um store compartilhado
  (Redis/Upstash).
- `unsafe-inline` permanece em `script-src`/`style-src` porque o app ainda não
  usa nonce por requisição; é o padrão atual do Next.js App Router sem middleware
  de nonce.
- Proteção de código no cliente reduz exposição, mas **JavaScript de front-end é
  sempre inspecionável**: nada sensível deve depender de segredo no cliente.
