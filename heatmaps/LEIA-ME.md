# Mapas de calor - atualização manual

Esta pasta contém mapas reais por partida, disponíveis no aplicativo Tigre Data. O importador NÃO possui cron ou execução automática após partidas.

## Depois de cada jogo

1. Abra o Sofascore e localize o ID numérico da partida encerrada.
2. Abra o repositório Tigredata-data no GitHub > Actions > Mapa de calor - importar após jogo (MANUAL) > Run workflow.
3. Informe o ID, marque a confirmação manual e clique Run workflow.
4. A ação tenta obter a escalação e os mapas pela API pública do Sofascore. Caso o acesso seja negado (HTTP 403/429), ela falha SEM publicar números.
5. Se o acesso não estiver permitido pelo provedor mas você tiver uma cópia de dados que pode utilizar e redistribuir, envie um JSON autorizado a heatmaps/inbox/ID_DA_PARTIDA.json e rode a ação novamente.

Exemplo **apenas do formato** (os pontos são fictícios e NÃO devem ser usados como dados reais):

```json
{
  "eventId": "12345678",
  "matchDate": "2026-10-18",
  "homeTeam": "São Bernardo",
  "awayTeam": "Criciúma",
  "finished": true,
  "players": [
    {
      "sofaId": "783490",
      "name": "Marcelo Hermes",
      "points": [
        {
          "x": 22,
          "y": 44
        },
        {
          "x": 54,
          "y": 67
        }
      ]
    }
  ]
}
```

Os dados de origem devem vir de uma fonte autorizada, com coordenadas reais por atleta e evento. A ação valida IDs existentes no elenco, a partida encerrada e cada posição na escala 0–100.

Ao concluir, a ação salva heatmaps/events/ID_DA_PARTIDA.json e atualiza heatmaps/index.json. A interface do aplicativo apenas lê o índice e o arquivo arquivado; ela não acessa automaticamente o Sofascore.

Sem direitos para republicar esses dados, não envie o arquivo. Em caso de bloqueio não use proxys, desafios automatizados nem coordenadas estimadas.
