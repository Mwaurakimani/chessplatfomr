export const getTimeClass = (timeControl: string) => {
  const time = parseInt(timeControl);
  if (time <= 3) return 'bullet';
  if (time <= 8) return 'blitz';
  return 'rapid';
};
