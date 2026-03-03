Para ícones de corpo:
https://visualpharm.com/free-icons/leg-595b40b65ba036ed117d1eec
https://thenounproject.com/icons/

## Estrutura do plano de treino

A página `index.html` agora carrega todo o conteúdo a partir do
arquivo `training-plan.json`. Isso torna mais fácil para ferramentas de
IA ou outros processos revisarem e atualizarem a rotina sem tocar no
HTML.

O JSON tem três seções principais:

1. **activities** – metas de agenda (costas, peito, pernas, etc.) com
   nome, cores e ícones.
2. **weeklySchedule** – sequência de 7 dias e a atividade associada a
   cada dia; a lista pode ser sobrescrita pelo `localStorage`.
3. **sections** – cada bloco de exercícios mostrado na interface.
   Cada seção contém:
   - `id` e `title` (o `id` é usado em `<h2>` e para cores específicas)
   - `colorClass` reaproveitado pelo CSS existente para pintar o cabeçalho
   - `columns` (lista de objetos `{key,title}` permitindo variação de colunas)
   - `exercises` (objetos com propriedades correspondentes às chaves
     declaradas; também aceitam `note`, `superset` e `areaIcon` para
     mobilidade).

> Adicionar novas seções/exercícios é tão simples quanto editar o JSON.
> O JavaScript (`training-plan.js`) renderiza dinamicamente tudo isto.

### Arquivos relevantes

- `training-plan.json` – dados estruturados do plano de treino.
- `training-plan.js` – lógica de carregamento, renderização e manipulação
  do plano.
- `index.html` – marcação mínima e referência ao JSON/JS.
