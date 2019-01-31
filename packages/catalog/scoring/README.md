# Scoring

Keep track of scores

## Configuration Options

- `totalScoreFn` (`string`): the function body that calculates the total score based on the parameter scores, which is an array of scores with type number (default: adds all the scores in the array);
- `oneToOneScoring` (`boolean`): if set to `true`, every `sourceId` can only give `targetId` a score once (default: `false`)

## Actions

- create-score
- show-score
- show-target
