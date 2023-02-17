export async function timeEvent<EventReturnType>(
  eventFunction: () => Promise<EventReturnType>,
  {
    description,
    performanceMeasures,
  }: { description: string; performanceMeasures: PerformanceMeasure[] },
): Promise<EventReturnType> {
  // prepare
  const startName = `${description}-started`;
  const finishName = `${description}-finished`;

  // time
  performance.mark(startName);
  const result = await eventFunction();
  performance.mark(finishName);

  // record
  performanceMeasures.push(
    performance.measure(description, startName, finishName),
  );

  return result;
}
