export const generateSlug = (string: string) => {
  return (
    string
      .toLowerCase()
      .split(' ')
      .filter((value) => Boolean(value))
      .join('-') + `-${String(Date.now()).slice(-6)}`
  );
};
