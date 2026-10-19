# Atualização de jogadores — Tigre Data

O arquivo `latest.json` é lido diretamente pelo Tigre Data (V53). A mesma automação de resultados executa, a cada duas horas, uma consulta ao elenco do Criciúma na **ESPN — Série B 2026**.

## Campos atualizados
- Identificação: a correspondência utiliza nome, camisa, data de nascimento e identificadores da ESPN. Havendo ambiguidade ou conflito, **não substitui** o atleta.
- Dados pessoais e antropométricos: nome completo, data de nascimento, nacionalidade, altura em cm, peso em kg e camisa, quando publicados e identificados com segurança.
- Estatísticas da temporada: partidas, gols, assistências, cartões amarelos/vermelhos, finalizações, chutes no alvo, faltas e impedimentos; para goleiros, defesas e gols sofridos.
- Cada campo preenchido pela ESPN contém fonte e data de consulta em `playerFieldSources` / `seasonStats.metricSources`. Estatísticas avançadas preexistentes permanecem com seus carimbos de data anteriores; o processo não as declara atualizadas.
- O resultado da atualização é auditável em `sourceState.playersESPN` (cobertura, correspondências e casos pendentes).

## Dados que NÃO podem ser presumidos
- Quilômetros percorridos, velocidade média/máxima, sprints, distância em alta intensidade, mapas de calor reais e mapas de passes exigem rastreamento ou estatísticas licenciadas por partida. A ESPN deste feed não devolve esses campos, portanto o robô não gera números nem coordenadas artificiais.
- Pé dominante, contratos, clubes anteriores e histórico de carreira não são atualizados pela fonte ESPN deste processo. Permanecem dados com origem anterior quando disponíveis.
- Atletas existentes que não aparecem na fonte, ou cuja correspondência é incerta, são preservados com informações anteriores. Não adicionar/remover atletas automaticamente sem confirmação de elenco oficial.

## Monitoramento
- Workflow `.github/workflows/update-scores.yml`, no repositório `Tigredata-data`.
- Sem configuração de token de terceiros: conexão de leitura pública da ESPN, sem promessa de SLA/licença comercial.
- Se consulta ESPN falhar, o JSON anterior permanece e o erro é informado no log da Action. Resultados e classificação podem continuar sendo atualizados independentemente.
- Uma nova versão do APK **não é necessária** para receber `latest.json` se a versão instalada já busca o feed na internet.

Cobertura de validação inicial em 19/10/2026: 30 atletas identificados dentre os 35 nomes já presentes no arquivo; 5 aguardam confirmação adicional. **Não** interpretar essa cobertura como completude de todas as estatísticas avançadas.
