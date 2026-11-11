export function findDataAction(target, actionKeys) {
  return Object.keys(actionKeys).find((key) => target.dataset[actionKeys[key]])
}
