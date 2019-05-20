# Scoring

Keep track of scores

## Actions

- create-score
- delete-score
- delete-scores
- show-score
- show-target
- show-targets-by-score
- update-score

## Configuration Options

| Option | Type | Default | Description |
| ------ | ---- | ------  | ----------- |
| `totalScoreFn` | `string` | adds all the scores in the array |  the function body that calculates the total score based on the parameter scores, which is an array of scores with type number |
| `oneToOneScoring` | `boolean` | `true` | Determines whether every `sourceId` can only give `targetId` a score once |
